import uuid
from flask import Blueprint, jsonify, session
from models import db, Form
from routes import login_required, current_admin_id

templates_bp = Blueprint('templates', __name__, url_prefix='/edusentiai/api/templates')

TEMPLATE_LIBRARY = [
    {
        "key": "faculty_feedback",
        "title": "Faculty Feedback",
        "description": "Collect structured student feedback on teaching quality, course delivery and faculty performance.",
        "category": "Academic",
        "icon": "graduation-cap",
        "fields": [
            {"field_name": "student_name", "field_label": "Student Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "faculty_name", "field_label": "Faculty Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "subject", "field_label": "Subject / Course", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "teaching_quality", "field_label": "Teaching Quality", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "course_content", "field_label": "Course Content Rating", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "overall_experience", "field_label": "Overall Experience", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "comments", "field_label": "Additional Comments", "field_type": "paragraph", "is_required": False, "options": None}
        ]
    },
    {
        "key": "event_registration",
        "title": "Event Registration",
        "description": "Register attendees for campus events, workshops and seminars with all essential details.",
        "category": "Events",
        "icon": "calendar",
        "fields": [
            {"field_name": "full_name", "field_label": "Full Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "department", "field_label": "Department", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "year", "field_label": "Academic Year", "field_type": "dropdown", "is_required": True, "options": ["First Year", "Second Year", "Third Year", "Final Year"]},
            {"field_name": "session", "field_label": "Preferred Session", "field_type": "radio", "is_required": True, "options": ["Morning", "Afternoon", "Evening"]},
            {"field_name": "expectations", "field_label": "What do you hope to learn?", "field_type": "paragraph", "is_required": False, "options": None}
        ]
    },
    {
        "key": "course_feedback",
        "title": "Course Feedback",
        "description": "Evaluate course structure, materials and learning outcomes at the end of a term.",
        "category": "Academic",
        "icon": "book-open",
        "fields": [
            {"field_name": "course_name", "field_label": "Course Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "difficulty", "field_label": "Course Difficulty", "field_type": "dropdown", "is_required": True, "options": ["Too Easy", "Balanced", "Challenging", "Too Hard"]},
            {"field_name": "material_quality", "field_label": "Quality of Materials", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "pace", "field_label": "Pace of the Course", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "recommend", "field_label": "Would you recommend this course?", "field_type": "radio", "is_required": True, "options": ["Yes", "Maybe", "No"]},
            {"field_name": "suggestions", "field_label": "Suggestions for Improvement", "field_type": "paragraph", "is_required": False, "options": None}
        ]
    },
    {
        "key": "student_survey",
        "title": "Student Satisfaction Survey",
        "description": "Measure overall student satisfaction with campus facilities, support and academics.",
        "category": "Survey",
        "icon": "smile",
        "fields": [
            {"field_name": "campus_facilities", "field_label": "Campus Facilities", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "academic_support", "field_label": "Academic Support", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "extracurriculars", "field_label": "Extracurricular Activities", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "satisfaction", "field_label": "Overall Satisfaction", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "feedback", "field_label": "Anything else you'd like to share?", "field_type": "paragraph", "is_required": False, "options": None}
        ]
    },
    {
        "key": "hackathon_registration",
        "title": "Hackathon Registration",
        "description": "Sign up teams and participants for hackathons with skills and track preferences.",
        "category": "Events",
        "icon": "code",
        "fields": [
            {"field_name": "participant_name", "field_label": "Participant Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "team_name", "field_label": "Team Name", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "track", "field_label": "Preferred Track", "field_type": "dropdown", "is_required": True, "options": ["AI/ML", "Web", "Mobile", "Blockchain", "IoT"]},
            {"field_name": "experience", "field_label": "Experience Level", "field_type": "radio", "is_required": True, "options": ["Beginner", "Intermediate", "Advanced"]},
            {"field_name": "skills", "field_label": "Key Skills", "field_type": "text", "is_required": False, "options": None}
        ]
    },
    {
        "key": "alumni_feedback",
        "title": "Alumni Feedback",
        "description": "Gather insights from alumni on career outcomes and institutional impact.",
        "category": "Survey",
        "icon": "users",
        "fields": [
            {"field_name": "graduation_year", "field_label": "Graduation Year", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "current_role", "field_label": "Current Role", "field_type": "text", "is_required": True, "options": None},
            {"field_name": "education_value", "field_label": "Value of Education Received", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "career_readiness", "field_label": "Career Readiness", "field_type": "rating", "is_required": True, "options": None},
            {"field_name": "stay_connected", "field_label": "Would you like to mentor students?", "field_type": "radio", "is_required": True, "options": ["Yes", "No"]},
            {"field_name": "testimonial", "field_label": "Share a testimonial", "field_type": "paragraph", "is_required": False, "options": None}
        ]
    }
]


@templates_bp.route('', methods=['GET'])
@login_required
def list_templates():
    return jsonify({
        "status": "success",
        "templates": [
            {
                "key": t["key"],
                "title": t["title"],
                "description": t["description"],
                "category": t["category"],
                "icon": t["icon"],
                "field_count": len(t["fields"])
            }
            for t in TEMPLATE_LIBRARY
        ]
    }), 200


@templates_bp.route('/<string:key>/use', methods=['POST'])
@login_required
def use_template(key):
    admin_id = current_admin_id()
    template = next((t for t in TEMPLATE_LIBRARY if t["key"] == key), None)
    if not template:
        return jsonify({"status": "error", "message": "Template not found."}), 404

    new_form = Form(
        admin_id=admin_id,
        title=template["title"],
        description=template["description"],
        unique_link=str(uuid.uuid4())
    )
    new_form.set_schema(template["fields"])
    db.session.add(new_form)
    db.session.commit()
    return jsonify({"status": "success", "message": "Form created from template.", "form": new_form.to_dict()}), 201
