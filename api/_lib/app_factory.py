import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config, enable_sqlite_wal, is_sqlite
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Frontend and API are served from the same Vercel domain, so same-origin
    # requests need no CORS. We still allow all origins so the API can be called
    # from a separately hosted frontend if desired (JWT bearer auth, no cookies).
    CORS(app, supports_credentials=False, origins="*")

    db.init_app(app)

    from routes.auth import auth_bp
    from routes.forms import forms_bp
    from routes.public_portal import public_bp
    from routes.analytics import analytics_bp
    from routes.ai_report import ai_report_bp
    from routes.export_engine import export_bp
    from routes.dashboard import dashboard_bp
    from routes.responses import responses_bp
    from routes.insights import insights_bp
    from routes.templates import templates_bp
    from routes.users import users_bp
    from routes.notifications import notifications_bp
    from routes.settings import settings_bp

    for bp in (auth_bp, forms_bp, public_bp, analytics_bp,
               ai_report_bp, export_bp, dashboard_bp, responses_bp, insights_bp,
               templates_bp, users_bp, notifications_bp, settings_bp):
        app.register_blueprint(bp)

    with app.app_context():
        if is_sqlite():
            enable_sqlite_wal(db.engine)
        db.create_all()

    @app.route('/edusentiai/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "database": "postgres" if not is_sqlite() else "sqlite",
            "framework": "flask_serverless"
        }), 200

    @app.route('/edusentiai/api/admin/seed', methods=['POST'])
    def run_seed():
        """One-time DB seeding, guarded by the SEED_TOKEN env var.

        Call with header  Authorization: Bearer <SEED_TOKEN>  after the database
        is provisioned. Safe to leave deployed; it refuses to run without the token
        and skips if the demo admin already exists.
        """
        seed_token = os.environ.get('SEED_TOKEN')
        if not seed_token:
            return jsonify({"status": "error", "message": "Seeding disabled (SEED_TOKEN not set)."}), 403
        provided = request.headers.get('Authorization', '')
        if provided != f"Bearer {seed_token}":
            return jsonify({"status": "error", "message": "Invalid seed token."}), 401

        from seed import seed_into_current_db
        result = seed_into_current_db()
        return jsonify({"status": "success", **result}), 200

    return app
