from uuid import UUID as _UUID
from flask import request, current_app
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from sqlalchemy import or_
from ..extensions import db
from ..models import Event
from ..models.ticket import TicketType
from ..models.order import Order, OrderItem
from ..schemas.event_schema import EventSchema, EventCreateSchema, EventUpdateSchema
from ..utils.pagination import get_pagination_params


event_schema = EventSchema()
events_schema = EventSchema(many=True)
event_create_schema = EventCreateSchema()
event_update_schema = EventUpdateSchema()


def _parse_uuid(value):
    try:
        return _UUID(str(value))
    except Exception:
        return None


class EventsListResource(Resource):
    def get(self):
        try:
            page, per_page = get_pagination_params()
            q = (request.args.get('q') or '').strip()
            mine = (request.args.get('mine') or '').lower() in ('1', 'true', 'yes')
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
                    role = claims.get('role')
                    uid = _parse_uuid(get_jwt_identity())
                    if role == 'admin':
                        pass
                    elif role == 'organizer' and uid:
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
                q, mine, page, per_page, paginated.total, get_jwt_identity() if claims else None, (claims or {}).get('role')
            )
            return {
                'items': data,
                'meta': {
                    'page': paginated.page,
                    'per_page': paginated.per_page,
                    'total': paginated.total,
                    'pages': paginated.pages,
                }
            }, 200
        except Exception as e:
            current_app.logger.exception("events.list failed")
            return {"message": "Internal Server Error"}, 500

    @jwt_required()
    def post(self):
        claims = get_jwt()
        role = claims.get('role')
        organizer_id = _parse_uuid(get_jwt_identity())
        if role not in ('organizer', 'admin'):
            return {"message": "Forbidden"}, 403
        json_data = request.get_json() or {}
        errors = event_create_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400
        ev = Event(
            title=json_data['title'],
            description=json_data.get('description'),
            category=json_data.get('category'),
            venue_name=json_data.get('venue_name'),
            address=json_data.get('address'),
            start_date=json_data['start_date'],
            end_date=json_data['end_date'],
            banner_image_url=json_data.get('banner_image_url'),
            is_published=bool(json_data.get('is_published')),
            organizer_id=organizer_id,
        )
        db.session.add(ev)
        db.session.commit()
        current_app.logger.info("events.create id=%s by user=%s role=%s", ev.id, get_jwt_identity(), role)
        return {"event": event_schema.dump(ev)}, 201


class EventResource(Resource):
    def get(self, event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return {"message": "Invalid id"}, 400
        ev = Event.query.get(eid)
        if not ev:
            return {"message": "Not found"}, 404
        return {"event": event_schema.dump(ev)}, 200

    @jwt_required()
    def put(self, event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return {"message": "Invalid id"}, 400
        ev = Event.query.get(eid)
        if not ev:
            return {"message": "Not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        uid = _parse_uuid(get_jwt_identity())
        if role != 'admin' and (not uid or ev.organizer_id != uid):
            return {"message": "Forbidden"}, 403
        json_data = request.get_json() or {}
        errors = event_update_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400
        for field in (
            'title','description','category','venue_name','address','start_date','end_date','banner_image_url','is_published'
        ):
            if field in json_data:
                setattr(ev, field, json_data[field])
        db.session.commit()
        current_app.logger.info("events.update id=%s by user=%s role=%s fields=%s", ev.id, get_jwt_identity(), role, list(json_data.keys()))
        return {"event": event_schema.dump(ev)}, 200

    @jwt_required()
    def delete(self, event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return {"message": "Invalid id"}, 400
        ev = Event.query.get(eid)
        if not ev:
            return {"message": "Not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        uid = _parse_uuid(get_jwt_identity())
        if role != 'admin' and (not uid or ev.organizer_id != uid):
            return {"message": "Forbidden"}, 403

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
        current_app.logger.info("events.delete id=%s by user=%s role=%s", event_id, get_jwt_identity(), role)
        return {"message": "Deleted"}, 200


class EventStatsResource(Resource):
    @jwt_required()
    def get(self, event_id):
        eid = _parse_uuid(event_id)
        if not eid:
            return {"message": "Invalid id"}, 400
        ev = Event.query.get(eid)
        if not ev:
            return {"message": "Not found"}, 404

        claims = get_jwt()
        role = claims.get('role')
        uid = _parse_uuid(get_jwt_identity())
        if role != 'admin' and (not uid or ev.organizer_id != uid):
            return {"message": "Forbidden"}, 403

        # Compute totals
        ttypes = TicketType.query.filter_by(event_id=eid).all()
        tickets_sold = sum((t.quantity_sold or 0) for t in ttypes)
        tickets_total = sum((t.quantity_total or 0) for t in ttypes)
        tickets_remaining = max(0, tickets_total - tickets_sold)

        orders_q = Order.query.filter_by(event_id=eid)
        orders_count = orders_q.count()
        revenue_cents = sum((o.total_amount or 0) for o in orders_q if (o.status or 'paid') == 'paid')

        return {
            "stats": {
                "tickets_sold": tickets_sold,
                "tickets_total": tickets_total,
                "tickets_remaining": tickets_remaining,
                "orders_count": orders_count,
                "revenue_cents": revenue_cents,
            }
        }, 200
