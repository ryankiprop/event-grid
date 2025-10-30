import uuid
from datetime import datetime

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

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


class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('order_items.id'), nullable=False)
    event_id = db.Column(UUID(as_uuid=True), db.ForeignKey('events.id'), nullable=False, index=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    ticket_type_id = db.Column(UUID(as_uuid=True), db.ForeignKey('ticket_types.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending_payment',
                      index=True)  # pending_payment, active, used, cancelled
    qr_data = db.Column(db.Text, nullable=True)  # Store QR code data or reference
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # String-based relationships to avoid circular imports
    order_item = relationship('OrderItem', back_populates="tickets")
    event = relationship('Event', foreign_keys=[event_id])
    user = relationship('User', foreign_keys=[user_id])
    ticket_type = relationship('TicketType', foreign_keys=[ticket_type_id])
    
    def __repr__(self):
        return f'<Ticket {self.id} - {self.status}>'
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @classmethod
    def mark_as_used(cls, ticket_id):
        ticket = cls.query.get(ticket_id)
        if ticket:
            ticket.status = 'used'
            db.session.commit()
        return ticket
