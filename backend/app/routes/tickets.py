from uuid import UUID as _UUID
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from ..extensions import db
from ..models import Event, TicketType
from ..schemas.ticket_schema import TicketTypeSchema, TicketTypeCreateSchema, TicketTypeUpdateSchema


ticket_schema = TicketTypeSchema()
tickets_schema = TicketTypeSchema(many=True)
ticket_create_schema = TicketTypeCreateSchema()
ticket_update_schema = TicketTypeUpdateSchema()


def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None


class EventTicketsResource(Resource):
    def get(self, event_id):
        eid = _uuid(event_id)
        if not eid:
            return {"message": "Invalid event id"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404
        return {"tickets": tickets_schema.dump(event.ticket_types)}, 200

    @jwt_required()
    def post(self, event_id):
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
        json_data = request.get_json() or {}
        errors = ticket_create_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400
        tt = TicketType(
            event_id=event.id,
            name=json_data['name'],
            price=int(json_data['price']),
            quantity_total=int(json_data['quantity_total']),
        )
        db.session.add(tt)
        db.session.commit()
        return {"ticket": ticket_schema.dump(tt)}, 201


class TicketTypeResource(Resource):
    @jwt_required()
    def put(self, event_id, ticket_id):
        eid = _uuid(event_id)
        tid = _uuid(ticket_id)
        if not eid or not tid:
            return {"message": "Invalid id"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())
        if role != 'admin' and (not uid or event.organizer_id != uid):
            return {"message": "Forbidden"}, 403
        tt = TicketType.query.get(tid)
        if not tt or tt.event_id != event.id:
            return {"message": "Ticket type not found"}, 404
        data = request.get_json() or {}
        errors = ticket_update_schema.validate(data)
        if errors:
            return {"errors": errors}, 400
        for field in ("name", "price", "quantity_total"):
            if field in data:
                setattr(tt, field, data[field])
        db.session.commit()
        return {"ticket": ticket_schema.dump(tt)}, 200

    @jwt_required()
    def delete(self, event_id, ticket_id):
        eid = _uuid(event_id)
        tid = _uuid(ticket_id)
        if not eid or not tid:
            return {"message": "Invalid id"}, 400
        event = Event.query.get(eid)
        if not event:
            return {"message": "Event not found"}, 404
        claims = get_jwt()
        role = claims.get('role')
        uid = _uuid(get_jwt_identity())
        if role != 'admin' and (not uid or event.organizer_id != uid):
            return {"message": "Forbidden"}, 403
        tt = TicketType.query.get(tid)
        if not tt or tt.event_id != event.id:
            return {"message": "Ticket type not found"}, 404
        db.session.delete(tt)
        db.session.commit()
        return {"message": "Deleted"}, 200
