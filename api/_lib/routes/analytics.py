from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, session
from models import Form, Response
from routes import login_required, current_admin_id

analytics_bp = Blueprint('analytics', __name__, url_prefix='/edusentiai/api/analytics')


@analytics_bp.route('/form/<int:form_id>', methods=['GET'])
@login_required
def get_form_analytics(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404

    submissions = Response.query.filter_by(form_id=form.id).all()
    total_responses = len(submissions)

    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    timeline_activity = {}
    field_selections = {}
    form_fields = form.get_schema()

    for sub in submissions:
        answers = sub.get_answers()
        date_str = sub.submitted_at.strftime('%Y-%m-%d')
        timeline_activity[date_str] = timeline_activity.get(date_str, 0) + 1

        for field in form_fields:
            field_name = field.get('field_name')
            field_type = field.get('field_type')
            user_answer = answers.get(field_name)
            if user_answer is None:
                continue

            if field_type == 'rating':
                try:
                    val_int = int(user_answer)
                    if val_int in rating_distribution:
                        rating_distribution[val_int] += 1
                except (ValueError, TypeError):
                    pass

            elif field_type in ['dropdown', 'radio', 'checkbox']:
                if field_name not in field_selections:
                    field_selections[field_name] = {}
                if isinstance(user_answer, list):
                    for choice in user_answer:
                        choice_str = str(choice)
                        field_selections[field_name][choice_str] = field_selections[field_name].get(choice_str, 0) + 1
                else:
                    choice_str = str(user_answer)
                    field_selections[field_name][choice_str] = field_selections[field_name].get(choice_str, 0) + 1

    sorted_timeline = dict(sorted(timeline_activity.items()))

    return jsonify({
        "status": "success",
        "form_title": form.title,
        "metrics": {
            "total_submissions": total_responses,
            "rating_chart_data": {
                "labels": ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
                "datasets": [rating_distribution[i] for i in range(1, 6)]
            },
            "timeline_chart_data": {
                "labels": list(sorted_timeline.keys()),
                "datasets": list(sorted_timeline.values())
            },
            "categorical_breakdown": field_selections
        }
    }), 200


@analytics_bp.route('/overview', methods=['GET'])
@login_required
def analytics_overview():
    admin_id = current_admin_id()
    days_range = request.args.get('range', default=30, type=int)
    if days_range not in (7, 14, 30, 90):
        days_range = 30

    forms = Form.query.filter_by(admin_id=admin_id).all()
    form_map = {f.id: f for f in forms}
    form_ids = list(form_map.keys())
    responses = Response.query.filter(Response.form_id.in_(form_ids)).all() if form_ids else []

    cutoff = datetime.utcnow() - timedelta(days=days_range)
    in_range = [r for r in responses if r.submitted_at >= cutoff]

    total_responses = len(in_range)
    avg_daily = round(total_responses / days_range, 1) if days_range else 0
    completed = sum(1 for r in in_range if r.status == 'completed')
    completion_rate = round((completed / total_responses) * 100) if total_responses else 0
    active_forms = sum(1 for f in forms if f.is_active)

    today = datetime.utcnow().date()
    days = [(today - timedelta(days=i)) for i in range(days_range - 1, -1, -1)]
    day_counts = {d.isoformat(): 0 for d in days}
    for r in in_range:
        key = r.submitted_at.date().isoformat()
        if key in day_counts:
            day_counts[key] += 1
    response_trends = {
        "labels": [d.strftime('%b %d') for d in days],
        "data": [day_counts[d.isoformat()] for d in days]
    }

    by_form_counts = {}
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    location_counts = {}
    for r in in_range:
        by_form_counts[r.form_id] = by_form_counts.get(r.form_id, 0) + 1
        if r.location:
            location_counts[r.location] = location_counts.get(r.location, 0) + 1
        form = form_map.get(r.form_id)
        if form:
            answers = r.get_answers()
            for field in form.get_schema():
                if field.get('field_type') == 'rating':
                    try:
                        v = int(answers.get(field.get('field_name')))
                        if v in rating_distribution:
                            rating_distribution[v] += 1
                    except (ValueError, TypeError):
                        pass

    responses_by_form = [
        {"title": form_map[fid].title, "count": cnt}
        for fid, cnt in sorted(by_form_counts.items(), key=lambda x: x[1], reverse=True)
        if fid in form_map
    ]

    form_performance = []
    for f in forms:
        f_responses = [r for r in in_range if r.form_id == f.id]
        f_completed = sum(1 for r in f_responses if r.status == 'completed')
        form_performance.append({
            "title": f.title,
            "responses": len(f_responses),
            "completion": round((f_completed / len(f_responses)) * 100) if f_responses else 0,
            "is_active": f.is_active
        })
    form_performance.sort(key=lambda x: x["responses"], reverse=True)

    total_located = sum(location_counts.values())
    top_locations = [
        {
            "location": loc,
            "count": cnt,
            "percent": round((cnt / total_located) * 100) if total_located else 0
        }
        for loc, cnt in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return jsonify({
        "status": "success",
        "range_days": days_range,
        "summary": {
            "total_responses": total_responses,
            "average_daily": avg_daily,
            "completion_rate": completion_rate,
            "active_forms": active_forms
        },
        "response_trends": response_trends,
        "responses_by_form": responses_by_form,
        "rating_distribution": {
            "labels": ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
            "data": [rating_distribution[i] for i in range(1, 6)]
        },
        "form_performance": form_performance,
        "top_locations": top_locations
    }), 200
