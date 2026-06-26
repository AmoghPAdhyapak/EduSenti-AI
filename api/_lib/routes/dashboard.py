from datetime import datetime, timedelta
from flask import Blueprint, jsonify, session
from models import Form, Response
from routes import login_required, current_admin_id

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/edusentiai/api/dashboard')


def _admin_form_ids(admin_id):
    forms = Form.query.filter_by(admin_id=admin_id).all()
    return forms, {f.id: f for f in forms}


@dashboard_bp.route('/stats', methods=['GET'])
@login_required
def dashboard_stats():
    admin_id = current_admin_id()
    forms, form_map = _admin_form_ids(admin_id)
    form_ids = list(form_map.keys())

    total_forms = len(forms)
    active_forms = sum(1 for f in forms if f.is_active)

    responses = Response.query.filter(Response.form_id.in_(form_ids)).all() if form_ids else []
    total_responses = len(responses)
    completed = sum(1 for r in responses if r.status == 'completed')
    completion_rate = round((completed / total_responses) * 100) if total_responses else 0

    today = datetime.utcnow().date()
    days = [(today - timedelta(days=i)) for i in range(13, -1, -1)]
    day_counts = {d.isoformat(): 0 for d in days}
    for r in responses:
        key = r.submitted_at.date().isoformat()
        if key in day_counts:
            day_counts[key] += 1

    response_overview = {
        "labels": [d.strftime('%b %d') for d in days],
        "data": [day_counts[d.isoformat()] for d in days]
    }

    form_counts = {}
    for r in responses:
        form_counts[r.form_id] = form_counts.get(r.form_id, 0) + 1
    top_forms = sorted(form_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_performing = [
        {"id": fid, "title": form_map[fid].title, "response_count": cnt}
        for fid, cnt in top_forms if fid in form_map
    ]

    recent_sorted = sorted(responses, key=lambda r: r.submitted_at, reverse=True)[:6]
    recent_activity = [
        {
            "id": r.id,
            "user_email": r.user_email,
            "form_title": form_map[r.form_id].title if r.form_id in form_map else "Unknown",
            "submitted_at": r.submitted_at.isoformat(),
            "status": r.status
        }
        for r in recent_sorted
    ]

    seven_ago = datetime.utcnow() - timedelta(days=7)
    prev_seven = datetime.utcnow() - timedelta(days=14)
    this_week = sum(1 for r in responses if r.submitted_at >= seven_ago)
    last_week = sum(1 for r in responses if prev_seven <= r.submitted_at < seven_ago)
    weekly_growth = round(((this_week - last_week) / last_week) * 100) if last_week else (100 if this_week else 0)

    return jsonify({
        "status": "success",
        "stats": {
            "total_forms": total_forms,
            "active_forms": active_forms,
            "total_responses": total_responses,
            "completion_rate": completion_rate,
            "weekly_growth": weekly_growth,
            "responses_this_week": this_week
        },
        "response_overview": response_overview,
        "top_performing_forms": top_performing,
        "recent_activity": recent_activity
    }), 200
