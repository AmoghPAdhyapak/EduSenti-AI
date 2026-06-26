from flask import Blueprint, jsonify, session
from models import Form, Response
from routes import login_required, current_admin_id

users_bp = Blueprint('users', __name__, url_prefix='/edusentiai/api/users')


@users_bp.route('', methods=['GET'])
@login_required
def list_respondents():
    admin_id = current_admin_id()
    forms = Form.query.filter_by(admin_id=admin_id).all()
    form_map = {f.id: f for f in forms}
    form_ids = list(form_map.keys())
    responses = Response.query.filter(Response.form_id.in_(form_ids)).all() if form_ids else []

    people = {}
    for r in responses:
        p = people.setdefault(r.user_email, {
            "email": r.user_email,
            "submissions": 0,
            "last_activity": r.submitted_at,
            "first_seen": r.submitted_at,
            "location": r.location,
            "forms": set()
        })
        p["submissions"] += 1
        p["forms"].add(form_map[r.form_id].title)
        if r.submitted_at > p["last_activity"]:
            p["last_activity"] = r.submitted_at
            if r.location:
                p["location"] = r.location
        if r.submitted_at < p["first_seen"]:
            p["first_seen"] = r.submitted_at

    users_list = []
    for p in people.values():
        users_list.append({
            "email": p["email"],
            "submissions": p["submissions"],
            "last_activity": p["last_activity"].isoformat(),
            "first_seen": p["first_seen"].isoformat(),
            "location": p["location"],
            "forms_count": len(p["forms"])
        })
    users_list.sort(key=lambda x: x["last_activity"], reverse=True)

    return jsonify({
        "status": "success",
        "total_users": len(users_list),
        "users": users_list
    }), 200
