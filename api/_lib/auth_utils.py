"""Stateless JWT helpers for the Vercel (serverless) deployment.

Flask server-side sessions do not survive serverless cold starts, so admin and
student identity are carried in signed JWTs sent via the Authorization header.
"""
import os
import time
import jwt

SECRET_KEY = os.environ.get('SESSION_SECRET') or os.environ.get('JWT_SECRET')

ALGO = 'HS256'
ADMIN_TTL = 60 * 60 * 24 * 7          # 7 days
STUDENT_TTL = 60 * 60 * 24            # 1 day
OTP_TTL = 60 * 10                     # 10 minutes


def _require_secret():
    # Checked lazily (at token use) rather than at import so a missing env var
    # cannot crash the whole serverless function on import. No hardcoded default
    # is ever used — forgeable tokens would be a security hole.
    if not SECRET_KEY:
        raise RuntimeError(
            "SESSION_SECRET (or JWT_SECRET) must be set — it signs the auth JWTs."
        )
    return SECRET_KEY


def _encode(payload, ttl):
    body = dict(payload)
    body['exp'] = int(time.time()) + ttl
    return jwt.encode(body, _require_secret(), algorithm=ALGO)


def _decode(token):
    try:
        return jwt.decode(token, _require_secret(), algorithms=[ALGO])
    except jwt.PyJWTError:
        return None


def create_admin_token(admin_id):
    return _encode({'scope': 'admin', 'admin_id': admin_id}, ADMIN_TTL)


def create_student_token(email):
    return _encode({'scope': 'student', 'email': email}, STUDENT_TTL)


def create_otp_token(email, otp):
    return _encode({'scope': 'otp', 'email': email, 'otp': str(otp)}, OTP_TTL)


def read_admin_id(token):
    data = _decode(token)
    if data and data.get('scope') == 'admin':
        return data.get('admin_id')
    return None


def read_student_email(token):
    data = _decode(token)
    if data and data.get('scope') == 'student':
        return data.get('email')
    return None


def read_otp(token):
    data = _decode(token)
    if data and data.get('scope') == 'otp':
        return data.get('email'), data.get('otp')
    return None, None


def bearer_token():
    """Extract the bearer token from the current request's Authorization header."""
    from flask import request
    header = request.headers.get('Authorization', '')
    if header.startswith('Bearer '):
        return header[7:].strip()
    return None
