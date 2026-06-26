import re
from flask import Blueprint, jsonify, session
from models import db, Form, Response, NotificationRead
from routes import login_required, current_admin_id

_KEY_RE = re.compile(r'^(resp|form)-\d+$')

notifications_bp = Blueprint('notifications', __name__, url_prefix='/edusentiai/api/notifications')


def _build_notifications(admin_id):
    """Build the synthetic notification list for an admin (response + form activity)."""
    forms = Form.query.filter_by(admin_id=admin_id).all()
    form_map = {f.id: f for f in forms}
    form_ids = list(form_map.keys())
    responses = (
        Response.query.filter(Response.form_id.in_(form_ids))
        .order_by(Response.submitted_at.desc())
        .limit(20)
        .all()
        if form_ids else []
    )

    notifications = []
    for r in responses:
        form = form_map.get(r.form_id)
        notifications.append({
            "id": f"resp-{r.id}",
            "type": "response",
            "title": "New response received",
            "message": f"{r.user_email} submitted a response to \"{form.title if form else 'a form'}\".",
            "timestamp": r.submitted_at.isoformat(),
            "default_read": False,
            "icon": "inbox"
        })

    for f in sorted(forms, key=lambda x: x.created_at, reverse=True)[:5]:
        notifications.append({
            "id": f"form-{f.id}",
            "type": "form",
            "title": "Form activity",
            "message": f"\"{f.title}\" is {'active and collecting responses' if f.is_active else 'currently inactive'}.",
            "timestamp": f.created_at.isoformat(),
            "default_read": True,
            "icon": "file-text"
        })

    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    return notifications


def _read_keys(admin_id):
    return {r.notification_key for r in NotificationRead.query.filter_by(admin_id=admin_id).all()}


def _mark_read(admin_id, key):
    exists = NotificationRead.query.filter_by(admin_id=admin_id, notification_key=key).first()
    if not exists:
        db.session.add(NotificationRead(admin_id=admin_id, notification_key=key))


@notifications_bp.route('', methods=['GET'])
@login_required
def list_notifications():
    admin_id = current_admin_id()
    notifs = _build_notifications(admin_id)
    read_keys = _read_keys(admin_id)

    out = []
    unread = 0
    for n in notifs:
        read = n["default_read"] or n["id"] in read_keys
        if not read:
            unread += 1
        out.append({
            "id": n["id"],
            "type": n["type"],
            "title": n["title"],
            "message": n["message"],
            "timestamp": n["timestamp"],
            "read": read,
            "icon": n["icon"],
        })

    return jsonify({
        "status": "success",
        "unread_count": unread,
        "notifications": out
    }), 200


@notifications_bp.route('/<key>/read', methods=['POST'])
@login_required
def mark_read(key):
    if not _KEY_RE.match(key):
        return jsonify({"error": "invalid notification key"}), 400
    admin_id = current_admin_id()
    _mark_read(admin_id, key)
    db.session.commit()
    return jsonify({"status": "success"}), 200


@notifications_bp.route('/read-all', methods=['POST'])
@login_required
def mark_all_read():
    admin_id = current_admin_id()
    for n in _build_notifications(admin_id):
        if not n["default_read"]:
            _mark_read(admin_id, n["id"])
    db.session.commit()
    return jsonify({"status": "success"}), 200
