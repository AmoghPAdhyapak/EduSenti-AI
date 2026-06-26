"""Seed EduSentiAI with the demo admin, forms, and realistic responses.

Run:  cd edusentiai-backend && python seed.py
This DROPS and recreates all tables.
"""
import os
import uuid
import random
from datetime import datetime, timedelta

from app_factory import create_app
from models import db, Admin, Form, Response
from routes.templates import TEMPLATE_LIBRARY

LOCATIONS = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata"]
LOCATION_WEIGHTS = [32, 24, 18, 14, 5, 4, 3]

FIRST_NAMES = ["aarav", "vivaan", "aditya", "diya", "ananya", "ishaan", "kabir", "sara",
               "myra", "advait", "riya", "arjun", "kiara", "vihaan", "anika", "rohan",
               "navya", "aryan", "saanvi", "krish", "tara", "dev", "meera", "yash"]
LAST_NAMES = ["sharma", "verma", "patel", "reddy", "nair", "iyer", "gupta", "singh",
              "rao", "das", "mehta", "joshi", "kapoor", "menon", "bose"]

POSITIVE_COMMENTS = [
    "Excellent experience overall, the faculty was very supportive and engaging.",
    "Really well organized and the content was practical and relevant.",
    "Loved the interactive sessions, learned a lot in a short time.",
    "Great communication and clear explanations throughout.",
    "One of the best sessions I have attended this semester.",
    "The pace was perfect and the material was easy to follow.",
]
NEUTRAL_COMMENTS = [
    "It was good but could use more hands-on examples.",
    "Decent overall, a few sections felt a little rushed.",
    "Fine experience, nothing exceptional but nothing bad.",
    "Average, would appreciate more depth in some topics.",
]
NEGATIVE_COMMENTS = [
    "The session felt disorganized and hard to follow at times.",
    "Too fast paced, I struggled to keep up with the material.",
    "Expected more practical content, it was mostly theory.",
]

TEMPLATE_ORDER = [
    "faculty_feedback",
    "hackathon_registration",
    "event_registration",
    "course_feedback",
    "student_survey",
    "alumni_feedback",
]


def weighted_rating():
    return random.choices([5, 4, 3, 2, 1], weights=[42, 30, 16, 8, 4])[0]


def make_email():
    return f"{random.choice(FIRST_NAMES)}.{random.choice(LAST_NAMES)}{random.randint(1, 99)}@student.edu"


def build_answer(field, comment_pool):
    ft = field["field_type"]
    fn = field["field_name"]
    if ft == "rating":
        return weighted_rating()
    if ft in ("dropdown", "radio"):
        return random.choice(field["options"])
    if ft == "checkbox":
        return random.sample(field["options"], k=min(2, len(field["options"])))
    if ft == "paragraph":
        return random.choice(comment_pool)
    if ft == "email":
        return make_email()
    if ft == "number":
        return random.randint(1, 100)
    if ft == "date":
        return (datetime.utcnow() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
    if fn in ("graduation_year",):
        return str(random.randint(2015, 2024))
    return random.choice([
        "Computer Science", "Data Structures", "Dr. Priya Menon", "Team Phoenix",
        "Machine Learning", "Software Engineer", "Web Development", "Operating Systems"
    ])


def _populate():
    admin = Admin(
        name="Amaan J Sha",
        email="amaan@edusentiai.test",
        phone="+91 98765 43210",
    )
    admin.set_password("amaan@123")
    db.session.add(admin)
    db.session.commit()

    template_map = {t["key"]: t for t in TEMPLATE_LIBRARY}
    forms = []
    for idx, key in enumerate(TEMPLATE_ORDER):
        tpl = template_map[key]
        created = datetime.utcnow() - timedelta(days=random.randint(25, 60))
        form = Form(
            admin_id=admin.id,
            title=tpl["title"],
            description=tpl["description"],
            unique_link=str(uuid.uuid4()),
            created_at=created,
            is_active=(idx != 5),  # last one inactive for variety
        )
        form.set_schema(tpl["fields"])
        db.session.add(form)
        forms.append(form)
    db.session.commit()

    response_targets = [38, 31, 27, 22, 18, 12]
    total = 0
    for form, target in zip(forms, response_targets):
        schema = form.get_schema()
        for _ in range(target):
            roll = random.random()
            if roll < 0.62:
                pool = POSITIVE_COMMENTS
            elif roll < 0.85:
                pool = NEUTRAL_COMMENTS
            else:
                pool = NEGATIVE_COMMENTS

            answers = {}
            for field in schema:
                answers[field["field_name"]] = build_answer(field, pool)

            submitted = datetime.utcnow() - timedelta(
                days=random.randint(0, 29),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )
            status = "completed" if random.random() < 0.82 else "partial"
            resp = Response(
                form_id=form.id,
                user_email=make_email(),
                submitted_at=submitted,
                location=random.choices(LOCATIONS, weights=LOCATION_WEIGHTS)[0],
                status=status,
            )
            resp.set_answers(answers)
            db.session.add(resp)
            total += 1
        db.session.commit()

    return {"forms": len(forms), "responses": total}


def seed_into_current_db():
    """Idempotent seed used by the guarded /admin/seed route (runs in app context)."""
    db.create_all()
    if Admin.query.filter_by(email="amaan@edusentiai.test").first():
        return {"seeded": False, "message": "Demo data already present."}
    counts = _populate()
    return {"seeded": True, **counts}


def seed():
    """CLI seed: DROPS and recreates all tables, then populates demo data."""
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        counts = _populate()
        print("=" * 50)
        print("  EduSentiAI seed complete")
        print("  Admin: Amaan J Sha  /  password: amaan@123")
        print(f"  Forms: {counts['forms']}")
        print(f"  Responses: {counts['responses']}")
        print("=" * 50)


if __name__ == "__main__":
    seed()
