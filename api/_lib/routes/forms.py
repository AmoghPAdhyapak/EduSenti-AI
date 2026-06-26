import uuid
from flask import Blueprint, request, jsonify, session
from models import db, Form, Response
from routes import login_required, current_admin_id
from ai_engine import generate_form_schema

forms_bp = Blueprint('forms', __name__, url_prefix='/edusentiai/api/forms')


@forms_bp.route('', methods=['GET'])
@login_required
def list_forms():
    admin_id = current_admin_id()
    forms = Form.query.filter_by(admin_id=admin_id).order_by(Form.created_at.desc()).all()
    return jsonify({
        "status": "success",
        "forms": [f.to_dict() for f in forms]
    }), 200


@forms_bp.route('/ai-generate', methods=['POST'])
@login_required
def ai_generate_fields():
    data = request.get_json() or {}
    prompt_string = data.get('prompt', '').strip()
    if not prompt_string:
        return jsonify({"status": "error", "message": "Prompt text cannot be empty."}), 400
    try:
        suggested_schema = generate_form_schema(prompt_string)
        return jsonify({
            "status": "success",
            "prompt_processed": prompt_string,
            "fields": suggested_schema
        }), 200
    except ValueError as val_err:
        return jsonify({"status": "error", "message": str(val_err)}), 422
    except Exception:
        return jsonify({"status": "error", "message": "An error occurred while generating fields via AI."}), 500


@forms_bp.route('', methods=['POST'])
@login_required
def create_form():
    admin_id = current_admin_id()
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    schema = data.get('schema', [])

    if not title:
        return jsonify({"status": "error", "message": "Form title is required."}), 400
    if not isinstance(schema, list) or len(schema) == 0:
        return jsonify({"status": "error", "message": "Form schema must be a non-empty array of fields."}), 400

    try:
        new_form = Form(
            admin_id=admin_id,
            title=title,
            description=description,
            unique_link=str(uuid.uuid4())
        )
        new_form.set_schema(schema)
        db.session.add(new_form)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "Form created successfully.",
            "form": new_form.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Failed to save form to database."}), 500


@forms_bp.route('/<int:form_id>', methods=['GET'])
@login_required
def get_form(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404
    responses = Response.query.filter_by(form_id=form.id).order_by(Response.submitted_at.desc()).all()
    return jsonify({
        "status": "success",
        "form": form.to_dict(),
        "responses": [r.to_dict() for r in responses]
    }), 200


@forms_bp.route('/<int:form_id>', methods=['PUT'])
@login_required
def update_form(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404

    data = request.get_json() or {}
    if 'title' in data and data['title'].strip():
        form.title = data['title'].strip()
    if 'description' in data:
        form.description = data['description'].strip()
    if 'schema' in data and isinstance(data['schema'], list):
        form.set_schema(data['schema'])

    try:
        db.session.commit()
        return jsonify({"status": "success", "message": "Form updated.", "form": form.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Failed to update form."}), 500


@forms_bp.route('/<int:form_id>', methods=['DELETE'])
@login_required
def delete_form(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404
    try:
        db.session.delete(form)
        db.session.commit()
        return jsonify({"status": "success", "message": "Form deleted successfully."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Failed to delete form."}), 500


@forms_bp.route('/<int:form_id>/toggle', methods=['POST'])
@login_required
def toggle_form_status(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404
    form.is_active = not form.is_active
    db.session.commit()
    status_label = "activated" if form.is_active else "deactivated"
    return jsonify({
        "status": "success",
        "message": f"Form {status_label} successfully.",
        "is_active": form.is_active
    }), 200
