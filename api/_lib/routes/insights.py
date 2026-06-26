from flask import Blueprint, jsonify, session
from models import Form, Response
from routes import login_required, current_admin_id
from ai_engine import get_gemini_client

insights_bp = Blueprint('insights', __name__, url_prefix='/edusentiai/api/insights')


def _collect(admin_id):
    forms = Form.query.filter_by(admin_id=admin_id).all()
    form_map = {f.id: f for f in forms}
    form_ids = list(form_map.keys())
    responses = Response.query.filter(Response.form_id.in_(form_ids)).all() if form_ids else []
    return forms, form_map, responses


def _rating_values(form, response):
    answers = response.get_answers()
    vals = []
    for field in form.get_schema():
        if field.get('field_type') == 'rating':
            v = answers.get(field.get('field_name'))
            try:
                iv = int(v)
                if 1 <= iv <= 5:
                    vals.append(iv)
            except (ValueError, TypeError):
                pass
    return vals


@insights_bp.route('/overview', methods=['GET'])
@login_required
def insights_overview():
    admin_id = current_admin_id()
    forms, form_map, responses = _collect(admin_id)

    all_ratings = []
    per_form_ratings = {}
    topic_counts = {}

    for r in responses:
        form = form_map.get(r.form_id)
        if not form:
            continue
        rvals = _rating_values(form, r)
        all_ratings.extend(rvals)
        if rvals:
            per_form_ratings.setdefault(r.form_id, []).extend(rvals)

        answers = r.get_answers()
        for field in form.get_schema():
            if field.get('field_type') in ('dropdown', 'radio', 'checkbox'):
                val = answers.get(field.get('field_name'))
                choices = val if isinstance(val, list) else [val]
                for c in choices:
                    if c:
                        topic_counts[str(c)] = topic_counts.get(str(c), 0) + 1

    positive = sum(1 for v in all_ratings if v >= 4)
    neutral = sum(1 for v in all_ratings if v == 3)
    negative = sum(1 for v in all_ratings if v <= 2)
    rated_total = len(all_ratings)

    sentiment_score = round((sum(all_ratings) / rated_total / 5) * 100) if rated_total else 0
    pos_pct = round((positive / rated_total) * 100) if rated_total else 0
    neu_pct = round((neutral / rated_total) * 100) if rated_total else 0
    neg_pct = round((negative / rated_total) * 100) if rated_total else 0

    form_avgs = []
    for fid, vals in per_form_ratings.items():
        form_avgs.append({
            "form_id": fid,
            "title": form_map[fid].title,
            "avg_rating": round(sum(vals) / len(vals), 2),
            "responses": len(vals)
        })
    form_avgs.sort(key=lambda x: x['avg_rating'], reverse=True)

    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    most_mentioned = [{"topic": t, "count": c} for t, c in top_topics]

    strengths = [f for f in form_avgs if f['avg_rating'] >= 4][:4]
    improvements = [f for f in form_avgs if f['avg_rating'] < 4][-4:]

    return jsonify({
        "status": "success",
        "insights": {
            "sentiment_score": sentiment_score,
            "positive_pct": pos_pct,
            "neutral_pct": neu_pct,
            "negative_pct": neg_pct,
            "total_analyzed": len(responses),
            "ratings_analyzed": rated_total,
            "most_mentioned_topics": most_mentioned,
            "top_strengths": strengths,
            "areas_for_improvement": improvements,
            "form_breakdown": form_avgs
        }
    }), 200


@insights_bp.route('/generate', methods=['POST'])
@login_required
def generate_ai_report():
    admin_id = current_admin_id()
    forms, form_map, responses = _collect(admin_id)
    if not responses:
        return jsonify({"status": "error", "message": "No responses available to analyze."}), 400

    blocks = []
    for r in responses[:300]:
        form = form_map.get(r.form_id)
        if not form:
            continue
        answers = r.get_answers()
        line = f"[{form.title}] "
        parts = []
        for field in form.get_schema():
            fn = field.get('field_name')
            fl = field.get('field_label')
            if field.get('field_type') in ('paragraph', 'text', 'rating', 'dropdown', 'radio'):
                val = answers.get(fn)
                if val:
                    parts.append(f"{fl}: {val}")
        blocks.append(line + "; ".join(parts))

    payload = "\n".join(blocks)
    instruction = (
        "You are the Executive Academic Analyst for EduSentiAI. Analyze the aggregated student "
        "feedback across all forms and produce a concise institutional report in Markdown with these "
        "sections: ### Overall Summary, ### Sentiment Breakdown, ### Key Strengths, "
        "### Areas for Improvement, ### Recommended Actions. Be specific and professional."
    )

    try:
        from google.genai import types
        client = get_gemini_client()
        config = types.GenerateContentConfig(system_instruction=instruction, temperature=0.3)
        resp = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"Aggregated responses:\n{payload}",
            config=config
        )
        if not resp.text:
            return jsonify({"status": "error", "message": "AI returned an empty report."}), 500
        return jsonify({"status": "success", "report_markdown": resp.text}), 200
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 422
    except Exception as e:
        print(f"[INSIGHTS AI ERROR] {str(e)}")
        return jsonify({"status": "error", "message": "AI engine communication failure."}), 500
