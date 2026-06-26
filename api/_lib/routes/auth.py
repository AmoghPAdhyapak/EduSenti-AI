from flask import Blueprint, request, jsonify
from models import Admin
from routes import login_required, current_admin_id
from auth_utils import create_admin_token

auth_bp = Blueprint('auth', __name__, url_prefix='/edusentiai/api/auth/admin')

TEST_EMAIL = 'amaan@edusentiai.test'


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required."}), 400

    admin = Admin.query.filter_by(email=TEST_EMAIL).first()
    if not admin:
        return jsonify({"status": "error", "message": "Account not provisioned. Please contact support."}), 401

    if username.strip().lower() != admin.name.strip().lower() or not admin.check_password(password):
        return jsonify({"status": "error", "message": "Incorrect username or password."}), 401

    token = create_admin_token(admin.id)
    return jsonify({
        "status": "success",
        "message": "Authentication successful.",
        "token": token,
        "admin": admin.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Stateless JWT: logout is handled client-side by discarding the token.
    return jsonify({"status": "success", "message": "Logout successful."}), 200


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_profile():
    admin = Admin.query.get(current_admin_id())
    if not admin:
        return jsonify({"status": "error", "message": "Session invalid."}), 401
    return jsonify({"status": "success", "admin": admin.to_dict()}), 200
