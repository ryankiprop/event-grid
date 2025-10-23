import os
from uuid import UUID as _UUID
from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import Event, TicketType, Order, OrderItem, User
from sqlalchemy.orm import joinedload
from ..schemas.order_schema import OrderSchema, CreateOrderSchema
from ..utils.email import send_order_confirmation
from ..utils.qrcode_util import generate_ticket_qr

order_schema = OrderSchema()
orders_schema = OrderSchema(many=True)
create_order_schema = CreateOrderSchema()
FREE_MODE = (os.getenv('FREE_MODE') or '').lower() in ('1', 'true', 'yes')


def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None


class OrdersResource(Resource):
    @jwt_required()
    def post(self):
        if not FREE_MODE:
            return {"message": "Direct checkout is disabled. Use /api/payments/mpesa/initiate."}, 400
        json_data = request.get_json() or {}
        errors = create_order_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return {"message": "Invalid token"}, 400
        event_id = _uuid(json_data.get('event_id'))
        if not event_id:
            return {"message": "Invalid event id"}, 400
        event = Event.query.get(event_id)
        if not event:
            return {"message": "Event not found"}, 404
        # Build order
        order = Order(user_id=user_id, event_id=event.id, total_amount=0, status='paid')
        db.session.add(order)
        db.session.flush()  # get order.id
        total = 0
        # Validate and reserve tickets
        for item in json_data.get('items', []):
            tt_id = _uuid(item.get('ticket_type_id'))
            qty = int(item.get('quantity') or 0)
            if not tt_id or qty <= 0:
                db.session.rollback()
                return {"message": "Invalid ticket item"}, 400
            tt = TicketType.query.get(tt_id)
            if not tt or tt.event_id != event.id:
                db.session.rollback()
                return {"message": "Ticket type not found for event"}, 404
            if tt.quantity_available < qty:
                db.session.rollback()
                return {"message": f"Insufficient availability for {tt.name}"}, 400
            line_total = tt.price * qty
            total += line_total
            oi = OrderItem(order_id=order.id, ticket_type_id=tt.id, quantity=qty, unit_price=tt.price)
            db.session.add(oi)
            db.session.flush()  # get oi.id
            oi.qr_code = generate_ticket_qr(order.id, oi.id, user_id)
            tt.quantity_sold = (tt.quantity_sold or 0) + qty
        order.total_amount = total
        db.session.commit()
        # Send confirmation (best-effort)
        try:
            user = User.query.get(user_id)
            send_order_confirmation(user, order)
        except Exception:
            pass
        return {"order": order_schema.dump(order)}, 201


class UserOrdersResource(Resource):
    @jwt_required()
    def get(self):
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return {"message": "Invalid token"}, 400
        qs = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc())
        return {"orders": orders_schema.dump(qs.all())}, 200


class OrderDetailResource(Resource):
    @jwt_required()
    def get(self, order_id):
        oid = _uuid(order_id)
        if not oid:
            return {"message": "Invalid order id"}, 400
        order = Order.query.get(oid)
        if not order:
            return {"message": "Not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        user_id = _uuid(get_jwt_identity())
        if role != 'admin' and (not user_id or order.user_id != user_id):
            return {"message": "Forbidden"}, 403
        return {"order": order_schema.dump(order)}, 200


class EventOrdersResource(Resource):
    @jwt_required()
    def get(self, event_id):
        eid = _uuid(event_id)
        if not eid:
            return {"message": "Invalid event id"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())
        if role != 'admin' and (not uid or event.organizer_id != uid):
            return {"message": "Forbidden"}, 403
        qs = Order.query.filter_by(event_id=event.id).order_by(Order.created_at.desc())
        return {"orders": orders_schema.dump(qs.all())}, 200


class VerifyCheckinResource(Resource):
    @jwt_required()
    def post(self):
        json_data = request.get_json() or {}
        code = (json_data.get('code') or '').strip()
        eid = _uuid(json_data.get('event_id'))
        if not eid or not code:
            return {"message": "event_id and code are required"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404

        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())
        if role != 'admin' and (not uid or event.organizer_id != uid):
            return {"message": "Forbidden"}, 403

        oi = (
            OrderItem.query
            .join(Order, OrderItem.order_id == Order.id)
            .options(joinedload(OrderItem.order))
            .filter(Order.event_id == event.id, OrderItem.qr_code == code)
            .first()
        )
        if not oi:
            return {"valid": False, "message": "Invalid or unknown code"}, 200

        return {
            "valid": True,
            "order_item": {
                "id": str(oi.id),
                "order_id": str(oi.order_id),
                "ticket_type_id": str(oi.ticket_type_id),
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
                "checked_in": bool(oi.checked_in),
                "checked_in_at": oi.checked_in_at.isoformat() if oi.checked_in_at else None,
                "checked_in_by": str(oi.checked_in_by) if oi.checked_in_by else None,
            },
            "order": {
                "id": str(oi.order.id),
                "user_id": str(oi.order.user_id),
                "event_id": str(oi.order.event_id),
                "created_at": oi.order.created_at.isoformat(),
                "status": oi.order.status,
                "total_amount": oi.order.total_amount,
            }
        }, 200


class MarkCheckinResource(Resource):
    @jwt_required()
    def post(self):
        json_data = request.get_json() or {}
        code = (json_data.get('code') or '').strip()
        eid = _uuid(json_data.get('event_id'))
        if not eid or not code:
            return {"message": "event_id and code are required"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404

        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())
        if role != 'admin' and (not uid or event.organizer_id != uid):
            return {"message": "Forbidden"}, 403

        oi = (
            OrderItem.query
            .join(Order, OrderItem.order_id == Order.id)
            .options(joinedload(OrderItem.order))
            .filter(Order.event_id == event.id, OrderItem.qr_code == code)
            .first()
        )
        if not oi:
            return {"message": "Invalid or unknown code"}, 404

        if oi.checked_in:
            return {"message": "Already checked in", "already": True, "checked_in_at": oi.checked_in_at.isoformat() if oi.checked_in_at else None}, 200

        oi.checked_in = True
        oi.checked_in_at = datetime.utcnow()
        oi.checked_in_by = uid
        db.session.commit()

        return {
            "message": "Checked in",
            "order_item": {
                "id": str(oi.id),
                "checked_in": True,
                "checked_in_at": oi.checked_in_at.isoformat() if oi.checked_in_at else None,
                "checked_in_by": str(oi.checked_in_by) if oi.checked_in_by else None,
            }
        }, 200


class VerifyCheckinResource(Resource):
    @jwt_required()
    def post(self):
        json_data = request.get_json() or {}
        event_id = _uuid(json_data.get('event_id'))
        code = (json_data.get('code') or '').strip()
        if not event_id or not code:
            return {"valid": False, "message": "Missing event_id or code"}, 400

        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())

        # Only organizers/admins can check in for their events
        if role not in ('organizer', 'admin'):
            return {"valid": False, "message": "Forbidden"}, 403

        # Find order item with matching QR code for this event
        oi = (
            OrderItem.query
            .join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )

        if not oi:
            return {"valid": False, "message": "Invalid code"}, 404

        # Check if user has permission for this event
        if role == 'organizer' and oi.order.event.organizer_id != uid:
            return {"valid": False, "message": "Forbidden"}, 403

        return {
            "valid": True,
            "order": {
                "id": str(oi.order.id),
                "user_id": str(oi.order.user_id),
                "total_amount": oi.order.total_amount,
                "status": oi.order.status,
                "created_at": oi.order.created_at.isoformat() if oi.order.created_at else None,
            },
            "order_item": {
                "id": str(oi.id),
                "ticket_type_id": str(oi.ticket_type_id),
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
                "qr_code": oi.qr_code,
                "checked_in": bool(oi.checked_in),
                "checked_in_at": oi.checked_in_at.isoformat() if oi.checked_in_at else None,
                "checked_in_by": str(oi.checked_in_by) if oi.checked_in_by else None,
            }
        }, 200


class MarkCheckinResource(Resource):
    @jwt_required()
    def post(self):
        json_data = request.get_json() or {}
        event_id = _uuid(json_data.get('event_id'))
        code = (json_data.get('code') or '').strip()
        if not event_id or not code:
            return {"message": "Missing event_id or code"}, 400

        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())

        # Only organizers/admins can check in for their events
        if role not in ('organizer', 'admin'):
            return {"message": "Forbidden"}, 403

        # Find order item with matching QR code for this event
        oi = (
            OrderItem.query
            .join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )

        if not oi:
            return {"message": "Invalid code"}, 404

        # Check if user has permission for this event
        if role == 'organizer' and oi.order.event.organizer_id != uid:
            return {"message": "Forbidden"}, 403

        if oi.checked_in:
            return {"message": "Already checked in", "already": True}, 400

        oi.checked_in = True
        oi.checked_in_at = datetime.utcnow()
        oi.checked_in_by = uid
        db.session.commit()

        return {
            "message": "Checked in successfully",
            "order_item": {
                "id": str(oi.id),
                "checked_in": True,
                "checked_in_at": oi.checked_in_at.isoformat() if oi.checked_in_at else None,
                "checked_in_by": str(oi.checked_in_by) if oi.checked_in_by else None,
            }
        }, 200
