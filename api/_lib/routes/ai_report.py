from flask import Blueprint, jsonify, session
from google.genai import types
from models import Form, Response
from routes import login_required, current_admin_id
from ai_engine import get_gemini_client

ai_report_bp = Blueprint('ai_report', __name__, url_prefix='/edusentiai/api/analytics')

AI_REPORT_INSTRUCTION = """
You are the Executive Academic Analyst for EduSentiAI.
Your task is to analyze a raw collection of student form responses and compile a structured, premium analytical dashboard report.

Organize your output strictly into the following Markdown sections:
1. ### Executive Sentiment Summary (Provide an estimated percentage of positive, neutral, and negative sentiment)
2. ### Key Student Appraisals (Bulleted list of the most highly praised aspects)
3. ### Core Complaints & Friction Points (Bulleted list of actionable complaints or issues raised)
4. ### Actionable Administrative Recommendations (Constructive, high-impact changes for faculty or organizers)

Be direct, professional, and objective. Do not append conversational introductory phrases.
"""


@ai_report_bp.route('/form/<int:form_id>/ai-report', methods=['POST'])
@login_required
def generate_qualitative_report(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404

    submissions = Response.query.filter_by(form_id=form.id).all()
    if not submissions:
        return jsonify({"status": "error", "message": "No responses found to analyze."}), 400

    compiled_text_payload = []
    form_schema = form.get_schema()

    for idx, sub in enumerate(submissions, 1):
        answers = sub.get_answers()
        respondent_block = f"Respondent #{idx}:\n"
        for field in form_schema:
            field_name = field.get('field_name')
            field_label = field.get('field_label')
            user_val = answers.get(field_name, "N/A")
            respondent_block += f" - {field_label}: {user_val}\n"
        compiled_text_payload.append(respondent_block)

    full_analysis_context = "\n".join(compiled_text_payload)

    try:
        client = get_gemini_client()
        config = types.GenerateContentConfig(
            system_instruction=AI_REPORT_INSTRUCTION,
            temperature=0.3
        )
        prompt_content = f"Form Title: {form.title}\n\nRaw Responses:\n{full_analysis_context}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_content,
            config=config
        )

        if not response.text:
            return jsonify({"status": "error", "message": "AI layer returned empty analysis."}), 500

        return jsonify({
            "status": "success",
            "form_title": form.title,
            "ai_insights_markdown": response.text
        }), 200

    except Exception as e:
        print(f"[AI REPORT ERROR] {str(e)}")
        return jsonify({"status": "error", "message": "AI engine communication failure."}), 500
