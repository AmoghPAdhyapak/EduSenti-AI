from flask import Blueprint, request, jsonify, session
from models import db, Admin
from routes import login_required, current_admin_id

settings_bp = Blueprint('settings', __name__, url_prefix='/edusentiai/api/settings')


@settings_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    admin = Admin.query.get(current_admin_id())
    if not admin:
        return jsonify({"status": "error", "message": "Profile not found."}), 404
    return jsonify({"status": "success", "profile": admin.to_dict()}), 200


@settings_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    admin = Admin.query.get(current_admin_id())
    if not admin:
        return jsonify({"status": "error", "message": "Profile not found."}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        admin.name = data['name'].strip()
    if 'email' in data and data['email'].strip():
        admin.email = data['email'].strip()
    if 'phone' in data:
        admin.phone = (data['phone'] or '').strip()

    try:
        db.session.commit()
        return jsonify({"status": "success", "message": "Profile updated.", "profile": admin.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Failed to update profile."}), 500


@settings_bp.route('/password', methods=['PUT'])
@login_required
def change_password():
    admin = Admin.query.get(current_admin_id())
    if not admin:
        return jsonify({"status": "error", "message": "Profile not found."}), 404

    data = request.get_json() or {}
    current = data.get('current_password', '')
    new = data.get('new_password', '')

    if not admin.check_password(current):
        return jsonify({"status": "error", "message": "Current password is incorrect."}), 401
    if len(new) < 6:
        return jsonify({"status": "error", "message": "New password must be at least 6 characters."}), 400

    admin.set_password(new)
    db.session.commit()
    return jsonify({"status": "success", "message": "Password updated successfully."}), 200
