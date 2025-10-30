import os
from datetime import datetime
from uuid import UUID as _UUID

from flask import request, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models.event import Event
from ..models.order import Order, OrderItem
from ..models.ticket import TicketType
from ..models.user import User
from ..schemas.order_schema import CreateOrderSchema, OrderSchema
from ..utils.email import send_order_confirmation
from ..utils.qrcode_util import generate_ticket_qr

order_schema = OrderSchema()
orders_schema = OrderSchema(many=True)
create_order_schema = CreateOrderSchema()
FREE_MODE = (os.getenv("FREE_MODE") or "").lower() in ("1", "true", "yes")

def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None

def init_app(app):
    @app.route('/api/orders', methods=['POST'])
    @jwt_required()
    def create_order():
        data = request.get_json() or {}
        
        # Always allow direct checkout, ignore payment method for now
        payment_method = 'free'  # Force free checkout
        data['payment_method'] = payment_method  # Ensure payment method is set
            
        errors = create_order_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400
            
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return jsonify({"message": "Invalid token"}), 400
            
        event_id = _uuid(data.get("event_id"))
        if not event_id:
            return jsonify({"message": "Invalid event id"}), 400
            
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"message": "Event not found"}), 404
            
        # Build order
        order = Order(
            user_id=user_id, 
            event_id=event.id, 
            total_amount=0, 
            status="paid" if payment_method == 'free' else "pending"
        )
        db.session.add(order)
        db.session.flush()  # get order.id
        
        total = 0
        # Validate and reserve tickets
        for item in data.get("items", []):
            tt_id = _uuid(item.get("ticket_type_id"))
            qty = int(item.get("quantity") or 0)
            
            if not tt_id or qty <= 0:
                db.session.rollback()
                return jsonify({"message": "Invalid ticket item"}), 400
                
            tt = TicketType.query.get(tt_id)
            if not tt or tt.event_id != event.id:
                db.session.rollback()
                return jsonify({"message": "Ticket type not found for event"}), 404
                
            if tt.quantity_available is not None and tt.quantity_available < qty:
                db.session.rollback()
                return jsonify({
                    "message": f"Insufficient availability for {tt.name}"
                }), 400
                
            line_total = tt.price * qty
            total += line_total
            
            oi = OrderItem(
                order_id=order.id,
                ticket_type_id=tt.id,
                quantity=qty,
                unit_price=tt.price,
            )
            db.session.add(oi)
            db.session.flush()  # get oi.id
            
            # Generate QR code for the ticket
            oi.qr_code = generate_ticket_qr(order.id, oi.id, user_id)
            
            # Update ticket availability
            if tt.quantity_available is not None:
                tt.quantity_available -= qty
                tt.quantity_sold = (tt.quantity_sold or 0) + qty
        
        order.total_amount = total
        
        is_free_checkout = payment_method == 'free'
        payment = Payment(
            order_id=order.id,
            amount=0 if is_free_checkout else total,
            provider='free' if is_free_checkout else 'mpesa',
            status='completed' if is_free_checkout else 'pending',
            currency='KES',
            payment_method=payment_method or 'mpesa'
        )
        db.session.add(payment)
        
        db.session.commit()
        
        # Send confirmation email
        try:
            user = User.query.get(user_id)
            if user and user.email:
                send_order_confirmation(user.email, order)
        except Exception as e:
            app.logger.error(f"Failed to send confirmation email: {str(e)}")
        
        return jsonify(order_schema.dump(order)), 201

    @app.route('/api/orders/user', methods=['GET'])
    @jwt_required()
    def get_user_orders():
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return jsonify({"message": "Invalid token"}), 400
            
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        return jsonify({"orders": orders_schema.dump(orders)})

    @app.route('/api/orders/<order_id>', methods=['GET'])
    @jwt_required()
    def get_order(order_id):
        oid = _uuid(order_id)
        if not oid:
            return jsonify({"message": "Invalid order id"}), 400
            
        order = Order.query.get(oid)
        if not order:
            return jsonify({"message": "Order not found"}), 404
            
        claims = get_jwt()
        role = claims.get("role")
        user_id = _uuid(get_jwt_identity())
        
        if role != "admin" and (not user_id or order.user_id != user_id):
            return jsonify({"message": "Forbidden"}), 403
            
        return jsonify({"order": order_schema.dump(order)})

    @app.route('/api/orders/event/<event_id>', methods=['GET'])
    @jwt_required()
    def get_event_orders(event_id):
        eid = _uuid(event_id)
        if not eid:
            return jsonify({"message": "Invalid event id"}), 400
            
        event = Event.query.get(eid)
        if not event:
            return jsonify({"message": "Event not found"}), 404
            
        claims = get_jwt()
        role = claims.get("role")
        uid = _uuid(get_jwt_identity())
        
        if role != "admin" and (not uid or event.organizer_id != uid):
            return jsonify({"message": "Forbidden"}), 403
            
        orders = Order.query.filter_by(event_id=event.id).order_by(Order.created_at.desc()).all()
        return jsonify({"orders": orders_schema.dump(orders)})

    @app.route('/api/orders/verify-checkin', methods=['POST'])
    @jwt_required()
    def verify_checkin():
        data = request.get_json() or {}
        event_id = _uuid(data.get("event_id"))
        code = (data.get("code") or "").strip()
        
        if not event_id or not code:
            return jsonify({"valid": False, "message": "Missing event_id or code"}), 400

        claims = get_jwt()
        role = claims.get("role")
        uid = _uuid(get_jwt_identity())

        # Only organizers/admins can check in for their events
        if role not in ("organizer", "admin"):
            return jsonify({"valid": False, "message": "Forbidden"}), 403

        # Find order item with matching QR code for this event
        oi = (
            OrderItem.query.join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )

        if not oi:
            return jsonify({"valid": False, "message": "Invalid code"}), 404

        # Check if user has permission for this event
        if role == "organizer" and oi.order.event.organizer_id != uid:
            return jsonify({"valid": False, "message": "Forbidden"}), 403

        return jsonify({
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
            },
        })

    @app.route('/api/orders/check-in', methods=['POST'])
    @jwt_required()
    def mark_checkin():
        data = request.get_json() or {}
        event_id = _uuid(data.get("event_id"))
        code = (data.get("code") or "").strip()
        
        if not event_id or not code:
            return jsonify({"valid": False, "message": "Missing event_id or code"}), 400

        claims = get_jwt()
        role = claims.get("role")
        uid = _uuid(get_jwt_identity())

        # Only organizers/admins can check in for their events
        if role not in ("organizer", "admin"):
            return jsonify({"valid": False, "message": "Forbidden"}), 403

        # Find order item with matching QR code for this event
        oi = (
            OrderItem.query.join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )

        if not oi:
            return jsonify({"valid": False, "message": "Invalid code"}), 404

        # Check if user has permission for this event
        if role == "organizer" and oi.order.event.organizer_id != uid:
            return jsonify({"valid": False, "message": "Forbidden"}), 403

        # Update check-in status
        oi.checked_in = True
        oi.checked_in_at = datetime.utcnow()
        oi.checked_in_by = uid
        db.session.commit()

        return jsonify({
            "valid": True,
            "message": "Check-in successful",
            "order_item_id": str(oi.id),
            "checked_in_at": oi.checked_in_at.isoformat(),
        })

    return app
