from uuid import UUID as _UUID

from flask import current_app, request, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required, verify_jwt_in_request
from sqlalchemy import or_

from ..extensions import db
from ..models import Event
from ..models.order import Order, OrderItem
from ..models.ticket import TicketType
from ..schemas.event_schema import (
    EventCreateSchema,
    EventSchema,
    EventUpdateSchema,
)
from ..utils.pagination import get_pagination_params

event_schema = EventSchema()
events_schema = EventSchema(many=True)
event_create_schema = EventCreateSchema()
event_update_schema = EventUpdateSchema()

def _parse_uuid(value):
    """Safely parse a UUID from a string.
    
    Args:
        value: The value to parse as UUID
        
    Returns:
        UUID: The parsed UUID or None if invalid
    """
    if not value:
        return None
    try:
        return _UUID(str(value).strip())
    except (ValueError, TypeError, AttributeError):
        return None


def validate_event_ownership(event_id, user_id, role):
    """Validate if the user has permission to access/modify the event.
    
    Args:
        event_id: UUID of the event
        user_id: UUID of the current user
        role: Role of the current user
        
    Returns:
        tuple: (event, error_response) where error_response is None if authorized
    """
    if not event_id:
        return None, (jsonify({"message": "Event ID is required"}), 400)
        
    event = Event.query.get(event_id)
    if not event:
        return None, (jsonify({"message": "Event not found"}), 404)
        
    if role != "admin" and (not user_id or event.organizer_id != user_id):
        return None, (jsonify({"message": "Forbidden"}), 403)
        
    return event, None

def init_app(app):
    @app.route('/api/events', methods=['GET'])
    def get_events():
        try:
            page, per_page = get_pagination_params()
            q = (request.args.get("q") or "").strip()
            mine = (request.args.get("mine") or "").lower() in ("1", "true", "yes")
            query = Event.query
            if q:
                like = f"%{q}%"
                query = query.filter(
                    or_(
                        Event.title.ilike(like),
                        Event.category.ilike(like),
                        Event.venue_name.ilike(like),
                        Event.address.ilike(like),
                    )
                )
            if mine:
                try:
                    verify_jwt_in_request()
                    claims = get_jwt()
                    role = claims.get("role")
                    uid = _parse_uuid(get_jwt_identity())
                    if role == "admin":
                        pass
                    elif role == "organizer" and uid:
                        query = query.filter(Event.organizer_id == uid)
                    else:
                        query = query.filter(False)
                except Exception:
                    query = query.filter(False)
            query = query.order_by(Event.start_date.desc())
            paginated = query.paginate(page=page, per_page=per_page, error_out=False)
            data = events_schema.dump(paginated.items)
            try:
                claims = get_jwt()
            except Exception:
                claims = {}
            current_app.logger.info(
                "events.list q=%s mine=%s page=%s per_page=%s total=%s user=%s role=%s",
                q,
                mine,
                page,
                per_page,
                paginated.total,
                get_jwt_identity() if claims else None,
                (claims or {}).get("role"),
            )
            return {
                "items": data,
                "meta": {
                    "page": paginated.page,
                    "per_page": paginated.per_page,
                    "total": paginated.total,
                    "pages": paginated.pages,
                },
            }, 200
        except Exception as e:
            current_app.logger.exception("events.list failed")
            return {"message": "Internal Server Error"}, 500

    @app.route('/api/events', methods=['POST'])
    @jwt_required()
    def create_event():
        claims = get_jwt()
        role = claims.get("role")
        organizer_id = _parse_uuid(get_jwt_identity())
        if role not in ("organizer", "admin"):
            return {"message": "Forbidden"}, 403
        json_data = request.get_json() or {}
        errors = event_create_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400
        ev = Event(
            title=json_data["title"],
            description=json_data.get("description"),
            category=json_data.get("category"),
            venue_name=json_data.get("venue_name"),
            address=json_data.get("address"),
            start_date=json_data["start_date"],
            end_date=json_data["end_date"],
            banner_image_url=json_data.get("banner_image_url"),
            is_published=bool(json_data.get("is_published")),
            organizer_id=organizer_id,
        )
        db.session.add(ev)
        db.session.commit()
        current_app.logger.info(
            "events.create id=%s by user=%s role=%s", ev.id, get_jwt_identity(), role
        )
        return {"event": event_schema.dump(ev)}, 201

    @app.route('/api/events/<event_id>', methods=['GET'])
    def get_event(event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return {"message": "Invalid id"}, 400
        ev = Event.query.get(eid)
        if not ev:
            return {"message": "Not found"}, 404
        return {"event": event_schema.dump(ev)}, 200

    @app.route('/api/events/<event_id>', methods=['PUT'])
    @jwt_required()
    def update_event(event_id):
        try:
            # Get current user info
            claims = get_jwt()
            role = claims.get("role")
            user_id = _parse_uuid(get_jwt_identity())
            
            # Parse and validate event ID
            eid = _parse_uuid(event_id)
            if not eid:
                return jsonify({"message": "Invalid event ID"}), 400
                
            # Get and validate event ownership
            event, error_response = validate_event_ownership(eid, user_id, role)
            if error_response:
                return error_response
                
            # Validate input data
            json_data = request.get_json() or {}
            errors = event_update_schema.validate(json_data)
            if errors:
                return jsonify({"message": "Validation error", "errors": errors}), 400
            
            # Update event fields
            update_fields = [
                "title", "description", "category", "venue_name",
                "address", "start_date", "end_date", "banner_image_url", "is_published"
            ]
            
            try:
                for field in update_fields:
                    if field in json_data:
                        setattr(event, field, json_data[field])
                
                db.session.commit()
                current_app.logger.info(
                    "Event updated - Event ID: %s, User: %s, Role: %s, Updated Fields: %s",
                    event.id, user_id, role, list(json_data.keys())
                )
                
                return jsonify({
                    "success": True,
                    "message": "Event updated successfully",
                    "event": event_schema.dump(event)
                }), 200
                
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(
                    "Error updating event %s: %s", event_id, str(e), exc_info=True
                )
                return jsonify({
                    "success": False,
                    "message": "Failed to update event",
                    "error": str(e)
                }), 500
                
        except Exception as e:
            current_app.logger.error(
                "Unexpected error in update_event: %s", str(e), exc_info=True
            )
            return jsonify({
                "success": False,
                "message": "An unexpected error occurred"
            }), 500

    @app.route('/api/events/<event_id>', methods=['DELETE'])
    @jwt_required()
    def delete_event(event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return jsonify({"message": "Invalid id"}), 400
        ev = Event.query.get(eid)
        if not ev:
            return jsonify({"message": "Not found"}), 404
            
        claims = get_jwt()
        role = claims.get("role")
        uid = _parse_uuid(get_jwt_identity())
        if role != "admin" and (not uid or ev.organizer_id != uid):
            return jsonify({"message": "Forbidden"}), 403

        try:
            # Delete related records first to avoid foreign key constraints
            # Delete order items (cascade will handle from orders, but being explicit)
            OrderItem.query.filter(OrderItem.order.has(event_id=eid)).delete()
            # Delete orders
            Order.query.filter_by(event_id=eid).delete()
            # Delete ticket types
            TicketType.query.filter_by(event_id=eid).delete()

            # Now delete the event
            db.session.delete(ev)
            db.session.commit()
            
            current_app.logger.info(
                "events.delete id=%s by user=%s role=%s", 
                event_id, 
                get_jwt_identity(), 
                role
            )
            return jsonify({"message": "Deleted"}), 200
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("Error deleting event: %s", str(e))
            return jsonify({"message": "Error deleting event"}), 500

    @app.route('/api/events/<string:event_id>/stats', methods=['GET'])
    @jwt_required()
    def get_event_stats(event_id):
        try:
            eid = _parse_uuid(event_id)
            if not eid:
                return jsonify({"message": "Invalid event ID format"}), 400
                
            event = Event.query.get(eid)
            if not event:
                return jsonify({"message": "Event not found"}), 404

            claims = get_jwt()
            role = claims.get("role")
            uid = _parse_uuid(get_jwt_identity())
            if role != "admin" and (not uid or event.organizer_id != uid):
                return jsonify({"message": "Forbidden"}), 403

            try:
                # Compute totals
                ttypes = TicketType.query.filter_by(event_id=eid).all()
                tickets_sold = sum((t.quantity_sold or 0) for t in ttypes)
                tickets_total = sum((t.quantity_total or 0) for t in ttypes)
                tickets_remaining = max(0, tickets_total - tickets_sold)

                orders_q = Order.query.filter_by(event_id=eid)
                orders_count = orders_q.count()
                
                # Calculate revenue in a separate query to avoid cursor issues
                paid_orders = Order.query.filter(
                    Order.event_id == eid,
                    Order.status == 'paid'
                ).all()
                revenue_cents = sum((o.total_amount or 0) for o in paid_orders)

                # Get recent orders with proper error handling
                recent_orders = []
                try:
                    recent_orders = (
                        Order.query
                        .filter_by(event_id=eid)
                        .order_by(Order.created_at.desc())
                        .limit(5)
                        .all()
                    )
                except Exception as e:
                    current_app.logger.error(f"Error fetching recent orders: {str(e)}")
                    # Continue with empty list if there's an error

                # Get ticket type breakdown with null checks
                ticket_breakdown = [
                    {
                        "id": str(t.id) if t.id else None,
                        "name": t.name if hasattr(t, 'name') else 'Unknown',
                        "sold": t.quantity_sold if hasattr(t, 'quantity_sold') else 0,
                        "total": t.quantity_total if hasattr(t, 'quantity_total') else 0,
                        "price": t.price if hasattr(t, 'price') else 0,
                    }
                    for t in ttypes
                ]

                return jsonify({
                    "tickets_sold": tickets_sold,
                    "tickets_total": tickets_total,
                    "tickets_remaining": tickets_remaining,
                    "orders_count": orders_count,
                    "revenue_cents": revenue_cents,
                    "revenue_kes": revenue_cents / 100 if revenue_cents else 0,
                    "ticket_breakdown": ticket_breakdown,
                    "recent_orders": [
                        {
                            "id": str(o.id) if o.id else None,
                            "user_id": str(o.user_id) if o.user_id else None,
                            "total_amount": o.total_amount if hasattr(o, 'total_amount') else 0,
                            "status": o.status if hasattr(o, 'status') else 'unknown',
                            "created_at": o.created_at.isoformat() if hasattr(o, 'created_at') and o.created_at else None,
                        }
                        for o in recent_orders
                        if o is not None
                    ],
                }), 200

            except Exception as e:
                current_app.logger.error(f"Error generating event stats: {str(e)}")
                return jsonify({"message": "Error generating event statistics"}), 500

        except Exception as e:
            current_app.logger.error(f"Unexpected error in get_event_stats: {str(e)}")
            return jsonify({"message": "Internal server error"}), 500
