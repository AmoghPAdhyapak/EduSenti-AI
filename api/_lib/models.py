import json
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(40), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    forms = db.relationship('Form', backref='creator', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": "Administrator"
        }


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True, default="")
    unique_link = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    schema_text = db.Column(db.Text, nullable=False, default="[]")
    responses = db.relationship('Response', backref='target_form', lazy=True, cascade="all, delete-orphan")

    def set_schema(self, schema_list):
        self.schema_text = json.dumps(schema_list)

    def get_schema(self):
        return json.loads(self.schema_text)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "unique_link": self.unique_link,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "schema": self.get_schema(),
            "response_count": len(self.responses)
        }


class Response(db.Model):
    __tablename__ = 'responses'
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    user_email = db.Column(db.String(120), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    answers_text = db.Column(db.Text, nullable=False, default="{}")
    location = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="completed")

    def set_answers(self, answers_dict):
        self.answers_text = json.dumps(answers_dict)

    def get_answers(self):
        return json.loads(self.answers_text)

    def to_dict(self, form_schema=None):
        return {
            "id": self.id,
            "form_id": self.form_id,
            "user_email": self.user_email,
            "submitted_at": self.submitted_at.isoformat(),
            "location": self.location,
            "status": self.status,
            "answers": self.get_answers()
        }


class NotificationRead(db.Model):
    __tablename__ = 'notification_reads'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    notification_key = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('admin_id', 'notification_key', name='uq_admin_notification'),
    )
