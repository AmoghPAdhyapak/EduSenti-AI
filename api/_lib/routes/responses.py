import io
import csv
from flask import Blueprint, request, jsonify, session, make_response
from models import db, Form, Response
from routes import login_required, current_admin_id

responses_bp = Blueprint('responses', __name__, url_prefix='/edusentiai/api/responses')


def _form_map(admin_id):
    forms = Form.query.filter_by(admin_id=admin_id).all()
    return {f.id: f for f in forms}


@responses_bp.route('', methods=['GET'])
@login_required
def list_responses():
    admin_id = current_admin_id()
    form_map = _form_map(admin_id)
    form_ids = list(form_map.keys())

    search = (request.args.get('search') or '').strip().lower()
    form_filter = request.args.get('form_id', type=int)
    status_filter = (request.args.get('status') or '').strip().lower()
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)

    if not form_ids:
        return jsonify({"status": "success", "responses": [], "total": 0, "page": page, "per_page": per_page}), 200

    query = Response.query.filter(Response.form_id.in_(form_ids))
    if form_filter and form_filter in form_map:
        query = query.filter(Response.form_id == form_filter)
    if status_filter in ('completed', 'partial'):
        query = query.filter(Response.status == status_filter)

    all_rows = query.order_by(Response.submitted_at.desc()).all()

    if search:
        all_rows = [
            r for r in all_rows
            if search in r.user_email.lower()
            or search in form_map[r.form_id].title.lower()
            or (r.location and search in r.location.lower())
        ]

    total = len(all_rows)
    start = (page - 1) * per_page
    page_rows = all_rows[start:start + per_page]

    items = []
    for r in page_rows:
        items.append({
            "id": r.id,
            "form_id": r.form_id,
            "form_title": form_map[r.form_id].title,
            "user_email": r.user_email,
            "submitted_at": r.submitted_at.isoformat(),
            "location": r.location,
            "status": r.status
        })

    return jsonify({
        "status": "success",
        "responses": items,
        "total": total,
        "page": page,
        "per_page": per_page
    }), 200


@responses_bp.route('/<int:response_id>', methods=['GET'])
@login_required
def get_response(response_id):
    admin_id = current_admin_id()
    form_map = _form_map(admin_id)
    r = Response.query.get(response_id)
    if not r or r.form_id not in form_map:
        return jsonify({"status": "error", "message": "Response not found."}), 404
    form = form_map[r.form_id]
    return jsonify({
        "status": "success",
        "response": {
            "id": r.id,
            "form_id": r.form_id,
            "form_title": form.title,
            "user_email": r.user_email,
            "submitted_at": r.submitted_at.isoformat(),
            "location": r.location,
            "status": r.status,
            "answers": r.get_answers(),
            "schema": form.get_schema()
        }
    }), 200


@responses_bp.route('/<int:response_id>', methods=['DELETE'])
@login_required
def delete_response(response_id):
    admin_id = current_admin_id()
    form_map = _form_map(admin_id)
    r = Response.query.get(response_id)
    if not r or r.form_id not in form_map:
        return jsonify({"status": "error", "message": "Response not found."}), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify({"status": "success", "message": "Response deleted."}), 200


@responses_bp.route('/export', methods=['GET'])
@login_required
def export_all_csv():
    admin_id = current_admin_id()
    form_map = _form_map(admin_id)
    form_ids = list(form_map.keys())
    rows = Response.query.filter(Response.form_id.in_(form_ids)).order_by(Response.submitted_at.desc()).all() if form_ids else []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['#', 'Form', 'Email', 'Location', 'Status', 'Submitted At'])
    for idx, r in enumerate(rows, 1):
        writer.writerow([
            idx,
            form_map[r.form_id].title,
            r.user_email,
            r.location or '',
            r.status,
            r.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    output.seek(0)
    resp = make_response(output.getvalue())
    resp.headers['Content-Type'] = 'text/csv; charset=utf-8'
    resp.headers['Content-Disposition'] = 'attachment; filename="EduSentiAI_all_responses.csv"'
    return resp
