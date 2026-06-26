from functools import wraps
from flask import jsonify, g
from auth_utils import bearer_token, read_admin_id


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_id = read_admin_id(bearer_token() or '')
        if not admin_id:
            return jsonify({
                "status": "error",
                "message": "Authentication required. Access denied."
            }), 401
        g.admin_id = admin_id
        return f(*args, **kwargs)
    return decorated_function


def current_admin_id():
    """Return the authenticated admin id for the current request (set by login_required)."""
    return getattr(g, 'admin_id', None)
