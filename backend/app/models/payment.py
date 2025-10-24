import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from ..extensions import db


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = db.Column(UUID(as_uuid=True), db.ForeignKey('orders.id'), nullable=False, index=True)
    provider = db.Column(db.String(50), nullable=False, default='mpesa')
    amount = db.Column(db.Integer, nullable=False, default=0)  # in cents
    phone = db.Column(db.String(20))
    status = db.Column(db.String(20), nullable=False, default='initiated')  # initiated|processing|success|failed|cancelled
    merchant_request_id = db.Column(db.String(100))
    checkout_request_id = db.Column(db.String(100), index=True)
    result_code = db.Column(db.String(20))
    result_desc = db.Column(db.String(255))
    raw_callback = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship('Order', backref=db.backref('payments', lazy=True))
