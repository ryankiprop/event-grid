import os
from datetime import datetime
from uuid import UUID as _UUID, uuid4
import json
import traceback

from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from ..extensions import db
# Import models using string references to avoid circular imports
from sqlalchemy.orm import lazyload

# Import models using string references to avoid circular imports
from ..models.event import Event
from ..models.order import Order, OrderItem
from ..models.user import User
from ..models.ticket import Ticket  # Import Ticket model directly
from ..schemas.order_schema import CreateOrderSchema, OrderSchema
from ..utils.email import send_order_confirmation
from ..utils.qrcode_util import build_ticket_qr_payload

order_schema = OrderSchema()
orders_schema = OrderSchema(many=True)
create_order_schema = CreateOrderSchema()

def is_free_mode():
    """Check if free mode is enabled via environment or request header"""
    env_free = (os.getenv("FREE_MODE") or "").lower() in ("1", "true", "yes")
    # Allow overriding per-request for testing
    if request.headers.get('X-Free-Mode') == 'true':
        return True
    return env_free

def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None

def init_app(app):
    @app.route('/api/orders', methods=['POST'])
    @jwt_required()
    def create_order():
        try:
            # Get request data
            data = request.get_json() or {}
            user_id = get_jwt_identity()
            event_id = data.get('event_id')
            
            # Basic validation
            if not event_id:
                return {"message": "Event ID is required"}, 400
                
            if not data.get('items'):
                return {"message": "No items provided. Add at least one ticket."}, 400
                
            # Create order
            order = Order(
                user_id=user_id,
                event_id=event_id,
                total_amount=0,
                status="paid",
                payment_method="free"
            )
            db.session.add(order)
            db.session.flush()  # Get order ID
            
            # First, create all order items
            order_items = []
            for item in data.get('items', []):
                ticket_type_id = item.get('ticket_type_id')
                quantity = int(item.get('quantity', 1))
                
                # Create order item
                order_item = OrderItem(
                    order_id=order.id,
                    ticket_type_id=ticket_type_id,
                    quantity=quantity,
                    unit_price=0,  # Free mode
                    qr_code=f"FREE-{order.id}-{ticket_type_id}"
                )
                db.session.add(order_item)
                order_items.append((order_item, ticket_type_id, quantity))
            
            # Commit order and order items first
            db.session.commit()
            
            # Now create tickets with the committed order item IDs
            for order_item, ticket_type_id, quantity in order_items:
                for _ in range(quantity):
                    try:
                        ticket = Ticket(
                            order_item_id=order_item.id,
                            event_id=event_id,
                            user_id=user_id,
                            ticket_type_id=ticket_type_id,
                            status="active",
                            qr_data=f"FREE-{order.id}-{ticket_type_id}-{uuid4()}"
                        )
                        db.session.add(ticket)
                    except Exception as e:
                        current_app.logger.error(f"Error creating ticket: {str(e)}")
                        current_app.logger.error(traceback.format_exc())
                        db.session.rollback()
                        return {"message": f"Failed to create ticket: {str(e)}"}, 500
            
            # Commit tickets
            db.session.commit()
            
            # Fetch the complete order with relationships
            from sqlalchemy.orm import joinedload
            
            # Query the order with all necessary relationships
            order_with_details = db.session.query(Order)\
                .options(
                    joinedload(Order.event),
                    joinedload(Order.items).joinedload(OrderItem.ticket_type)
                )\
                .filter(Order.id == order.id)\
                .first()
            
            # Format the response
            response = {
                "id": str(order.id),
                "message": "Order created successfully",
                "status": "paid",
                "event": {
                    "id": str(order_with_details.event.id),
                    "title": order_with_details.event.title,
                    "start_date": order_with_details.event.start_date.isoformat(),
                    "end_date": order_with_details.event.end_date.isoformat(),
                    "venue_name": order_with_details.event.venue_name,
                    "address": order_with_details.event.address
                },
                "items": [
                    {
                        "id": str(item.id),
                        "ticket_type_id": str(item.ticket_type_id),
                        "ticket_type_name": item.ticket_type.name if item.ticket_type else "General Admission",
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "qr_code": item.qr_code
                    }
                    for item in order_with_details.items
                ]
            }
            
            return response, 201       
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating order: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {"message": "Failed to create order", "error": str(e)}, 500

    @app.route('/api/orders/user', methods=['GET'])
    @jwt_required()
    def get_user_orders():
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return jsonify({"message": "Invalid token"}), 400
            
        from sqlalchemy.orm import joinedload
        
        # Query orders with relationships
        orders = (Order.query
            .filter_by(user_id=user_id)
            .options(
                joinedload(Order.event),
                joinedload(Order.items).joinedload(OrderItem.ticket_type)
            )
            .order_by(Order.created_at.desc())
            .all())
            
        # Use the schema with nested relationships
        from ..schemas.order_schema import OrderSchema
        schema = OrderSchema(many=True)
        return jsonify({"orders": schema.dump(orders)})

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

        # First: try exact match
        oi = (
            OrderItem.query.join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )
        # Fallback: decode as JSON QR and try the 'code' property
        if not oi:
            try:
                qr_payload = json.loads(code)
                inner_code = qr_payload.get("code")
                if inner_code:
                    oi = (
                        OrderItem.query.join(Order)
                        .filter(Order.event_id == event_id)
                        .filter(OrderItem.qr_code == inner_code)
                        .first()
                    )
            except Exception:
                pass

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

        # First: exact match
        oi = (
            OrderItem.query.join(Order)
            .filter(Order.event_id == event_id)
            .filter(OrderItem.qr_code == code)
            .first()
        )
        # Fallback: decode as JSON QR and try the 'code' property
        if not oi:
            try:
                qr_payload = json.loads(code)
                inner_code = qr_payload.get("code")
                if inner_code:
                    oi = (
                        OrderItem.query.join(Order)
                        .filter(Order.event_id == event_id)
                        .filter(OrderItem.qr_code == inner_code)
                        .first()
                    )
            except Exception:
                pass

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
