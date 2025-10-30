import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID

from ..extensions import db


class TicketType(db.Model):
    __tablename__ = "ticket_types"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("events.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Integer, nullable=False)  # price in cents
    quantity_total = db.Column(db.Integer, nullable=False, default=0)
    quantity_sold = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    event = db.relationship("Event", backref=db.backref("ticket_types", lazy=True))

    @property
    def quantity_available(self):
        return max(0, (self.quantity_total or 0) - (self.quantity_sold or 0))
