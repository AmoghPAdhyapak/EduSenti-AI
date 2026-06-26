from flask import Blueprint, request, jsonify
from models import db, Form, Response

public_bp = Blueprint('public', __name__, url_prefix='/edusentiai/api/portal')


@public_bp.route('/history', methods=['GET'])
def public_history():
    email = (request.args.get('email') or '').strip().lower()
    if not email:
        return jsonify({"status": "error", "message": "Email address is required."}), 400

    submissions = Response.query.filter_by(user_email=email).order_by(Response.submitted_at.desc()).all()
    history = []
    for sub in submissions:
        form = Form.query.get(sub.form_id)
        history.append({
            "response_id": sub.id,
            "form_title": form.title if form else "Unknown Form",
            "submitted_at": sub.submitted_at.isoformat(),
            "status": sub.status,
            "answers": sub.get_answers()
        })

    return jsonify({
        "status": "success",
        "email": email,
        "count": len(history),
        "submissions": history
    }), 200


@public_bp.route('/form/<string:unique_link>', methods=['GET'])
def get_public_form(unique_link):
    form = Form.query.filter_by(unique_link=unique_link).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found."}), 404
    if not form.is_active:
        return jsonify({"status": "error", "message": "This form is no longer accepting responses."}), 403
    return jsonify({
        "status": "success",
        "form": {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "unique_link": form.unique_link,
            "schema": form.get_schema()
        }
    }), 200


@public_bp.route('/form/<string:unique_link>/submit', methods=['POST'])
def submit_form_response(unique_link):
    form = Form.query.filter_by(unique_link=unique_link).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found."}), 404
    if not form.is_active:
        return jsonify({"status": "error", "message": "This form is no longer accepting responses."}), 403

    data = request.get_json() or {}
    user_email = data.get('email', '').strip().lower()
    answers = data.get('answers', {})

    if not user_email:
        return jsonify({"status": "error", "message": "Email address is required to submit a response."}), 400
    if not isinstance(answers, dict):
        return jsonify({"status": "error", "message": "Answers must be a valid key-value object."}), 400

    schema = form.get_schema()
    for field in schema:
        if field.get('is_required'):
            field_name = field.get('field_name')
            value = answers.get(field_name)
            if value is None or (isinstance(value, str) and not value.strip()):
                return jsonify({
                    "status": "error",
                    "message": f"Required field '{field.get('field_label', field_name)}' is missing."
                }), 400

    try:
        new_response = Response(form_id=form.id, user_email=user_email)
        new_response.set_answers(answers)
        db.session.add(new_response)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "Your response has been securely recorded. Thank you."
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Failed to save your response. Please try again."}), 500
