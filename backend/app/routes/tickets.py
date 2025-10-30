from uuid import UUID as _UUID
from functools import wraps

from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required, verify_jwt_in_request

from ..extensions import db
from ..models.event import Event
from ..models.ticket import TicketType
from ..models.order import OrderItem
from ..schemas.ticket_schema import (
    TicketTypeCreateSchema,
    TicketTypeSchema,
    TicketTypeUpdateSchema,
)

ticket_schema = TicketTypeSchema()
tickets_schema = TicketTypeSchema(many=True)
ticket_create_schema = TicketTypeCreateSchema()
ticket_update_schema = TicketTypeUpdateSchema()

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != required_role:
                return jsonify({"message": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None

def init_app(app):
    @app.route('/api/events/<event_id>/tickets', methods=['GET'])
    def get_event_tickets(event_id):
        eid = _uuid(event_id)
        if not eid:
            return jsonify({"message": "Invalid event ID"}), 400
            
        event = Event.query.get(eid)
        if not event:
            return jsonify({"message": "Event not found"}), 404
            
        tickets = TicketType.query.filter_by(event_id=eid).all()
        return jsonify(tickets_schema.dump(tickets))
        
    @app.route('/api/events/<event_id>/tickets', methods=['POST'])
    @jwt_required()
    def create_ticket_type(event_id):
        # Verify user is the event organizer or admin
        claims = get_jwt()
        if claims.get("role") not in ["admin", "organizer"]:
            return jsonify({"message": "Only organizers can create tickets"}), 403
            
        eid = _uuid(event_id)
        if not eid:
            return jsonify({"message": "Invalid event ID"}), 400
            
        # Verify event exists and belongs to the organizer
        event = Event.query.get(eid)
        if not event:
            return jsonify({"message": "Event not found"}), 404
            
        # Check if user is the event organizer or admin
        if claims.get("role") != "admin" and str(event.organizer_id) != get_jwt_identity():
            return jsonify({"message": "Not authorized to add tickets to this event"}), 403
            
        # Validate input
        data = request.get_json() or {}
        errors = ticket_create_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400
            
        # Create ticket type
        ticket = TicketType(
            name=data["name"],
            description=data.get("description", ""),
            price=data["price"],
            quantity_available=data.get("quantity_available"),
            event_id=eid,
            min_per_order=data.get("min_per_order", 1),
            max_per_order=data.get("max_per_order", 10),
            sale_start_date=data.get("sale_start_date"),
            sale_end_date=data.get("sale_end_date"),
            is_active=data.get("is_active", True),
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        return jsonify(ticket_schema.dump(ticket)), 201

    @app.route('/api/events/<event_id>/tickets/<ticket_id>', methods=['PUT'])
    @jwt_required()
    def update_ticket_type(event_id, ticket_id):
        # Verify user is the event organizer or admin
        claims = get_jwt()
        if claims.get("role") not in ["admin", "organizer"]:
            return jsonify({"message": "Only organizers can update tickets"}), 403
            
        eid = _uuid(event_id)
        tid = _uuid(ticket_id)
        if not eid or not tid:
            return jsonify({"message": "Invalid ID"}), 400
            
        # Verify event and ticket exist
        event = Event.query.get(eid)
        ticket = TicketType.query.get(tid)
        
        if not event or not ticket or ticket.event_id != eid:
            return jsonify({"message": "Event or ticket not found"}), 404
            
        # Check if user is the event organizer or admin
        if claims.get("role") != "admin" and str(event.organizer_id) != get_jwt_identity():
            return jsonify({"message": "Not authorized to update this ticket"}), 403
            
        # Validate input
        data = request.get_json() or {}
        errors = ticket_update_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400
            
        # Update ticket
        for field in ["name", "description", "price", "quantity_available", 
                     "min_per_order", "max_per_order", "sale_start_date", 
                     "sale_end_date", "is_active"]:
            if field in data:
                setattr(ticket, field, data[field])
                
        db.session.commit()
        return jsonify(ticket_schema.dump(ticket))
        
    @app.route('/api/events/<event_id>/tickets/<ticket_id>', methods=['DELETE'])
    @jwt_required()
    def delete_ticket_type(event_id, ticket_id):
        # Verify user is the event organizer or admin
        claims = get_jwt()
        if claims.get("role") not in ["admin", "organizer"]:
            return jsonify({"message": "Only organizers can delete tickets"}), 403
            
        eid = _uuid(event_id)
        tid = _uuid(ticket_id)
        if not eid or not tid:
            return jsonify({"message": "Invalid ID"}), 400
            
        # Verify event and ticket exist
        event = Event.query.get(eid)
        ticket = TicketType.query.get(tid)
        
        if not event or not ticket or ticket.event_id != eid:
            return jsonify({"message": "Event or ticket not found"}), 404
            
        # Check if user is the event organizer or admin
        if claims.get("role") != "admin" and str(event.organizer_id) != get_jwt_identity():
            return jsonify({"message": "Not authorized to delete this ticket"}), 403
            
        # Check if there are any orders for this ticket type
        order_count = OrderItem.query.filter_by(ticket_type_id=tid).count()
        
        if order_count > 0:
            return jsonify({
                "message": "Cannot delete a ticket type that has been purchased. "
                          "You can deactivate it instead by setting is_active to False."
            }), 400
            
        db.session.delete(ticket)
        db.session.commit()
        
        return jsonify({"message": "Ticket type deleted successfully"}), 200

    return app
