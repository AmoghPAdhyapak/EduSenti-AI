import io
import csv
from flask import Blueprint, session, make_response, jsonify
from models import Form, Response as DbResponse
from routes import login_required, current_admin_id
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER

export_bp = Blueprint('export', __name__, url_prefix='/edusentiai/api/export')


@export_bp.route('/form/<int:form_id>/csv', methods=['GET'])
@login_required
def export_csv(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404

    schema = form.get_schema()
    field_names = [f['field_name'] for f in schema]
    field_labels = [f['field_label'] for f in schema]

    submissions = DbResponse.query.filter_by(form_id=form.id).order_by(DbResponse.submitted_at.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['#', 'Email', 'Submitted At'] + field_labels)

    for idx, sub in enumerate(submissions, 1):
        answers = sub.get_answers()
        row = [idx, sub.user_email, sub.submitted_at.strftime('%Y-%m-%d %H:%M:%S')]
        for name in field_names:
            val = answers.get(name, '')
            if isinstance(val, list):
                val = ', '.join(str(v) for v in val)
            row.append(val)
        writer.writerow(row)

    output.seek(0)
    safe_title = "".join(c for c in form.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"EduSentiAI_{safe_title.replace(' ', '_')}_responses.csv"

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@export_bp.route('/form/<int:form_id>/pdf', methods=['GET'])
@login_required
def export_pdf(form_id):
    admin_id = current_admin_id()
    form = Form.query.filter_by(id=form_id, admin_id=admin_id).first()
    if not form:
        return jsonify({"status": "error", "message": "Form not found or access denied."}), 404

    schema = form.get_schema()
    submissions = DbResponse.query.filter_by(form_id=form.id).order_by(DbResponse.submitted_at.asc()).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#6366f1'), spaceAfter=6)
    subtitle_style = ParagraphStyle('SubtitleStyle', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#64748b'), spaceAfter=12)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#334155'))

    story = []
    story.append(Paragraph(f"EduSentiAI — {form.title}", title_style))
    story.append(Paragraph(f"Exported Responses Report • Total Submissions: {len(submissions)}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=10))

    if not submissions:
        story.append(Paragraph("No responses have been submitted for this form yet.", body_style))
    else:
        field_labels = [f['field_label'] for f in schema]
        field_names = [f['field_name'] for f in schema]

        header_row = ['#', 'Email', 'Submitted At'] + field_labels
        table_data = [header_row]

        for idx, sub in enumerate(submissions, 1):
            answers = sub.get_answers()
            row = [str(idx), sub.user_email, sub.submitted_at.strftime('%Y-%m-%d %H:%M')]
            for name in field_names:
                val = answers.get(name, '')
                if isinstance(val, list):
                    val = ', '.join(str(v) for v in val)
                row.append(str(val)[:60])
            table_data.append(row)

        col_count = len(header_row)
        col_width = (6.5 * inch) / col_count

        table = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(table)

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0')))
    story.append(Paragraph("Generated by EduSentiAI • Powered by Gemini AI", ParagraphStyle('footer', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor('#94a3b8'), alignment=TA_CENTER, spaceBefore=6)))

    doc.build(story)
    buffer.seek(0)

    safe_title = "".join(c for c in form.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"EduSentiAI_{safe_title.replace(' ', '_')}_report.pdf"

    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
