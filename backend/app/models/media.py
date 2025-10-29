import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID

from ..extensions import db

class Media(db.Model):
    """Media model for storing file uploads"""
    __tablename__ = 'media'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    content_type = db.Column(db.String(100))
    file_size = db.Column(db.Integer)  # in bytes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Use string-based relationship to avoid circular imports
    user = db.relationship('User', backref=db.backref('media_uploads', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Media {self.id} - {self.url}>'
