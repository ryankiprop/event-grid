import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    event_id = db.Column(UUID(as_uuid=True), db.ForeignKey('events.id'), nullable=False, index=True)
    total_amount = db.Column(db.Integer, nullable=False, default=0)  # in cents
    status = db.Column(db.String(20), nullable=False, default='paid')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('orders', lazy=True))
    event = db.relationship('Event', backref=db.backref('orders', lazy=True))
    items = db.relationship('OrderItem', backref=db.backref('order', lazy=True), cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey('orders.id'), nullable=False, index=True)
    ticket_type_id = db.Column(UUID(as_uuid=True), db.ForeignKey('ticket_types.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Integer, nullable=False, default=0)  # in cents
    qr_code = db.Column(db.String(255))
    checked_in = db.Column(db.Boolean, default=False, nullable=False)
    checked_in_at = db.Column(db.DateTime)
    checked_in_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))

    ticket_type = db.relationship('TicketType', backref=db.backref('order_items', lazy=True))
    checked_in_by_user = db.relationship('User', foreign_keys=[checked_in_by])
