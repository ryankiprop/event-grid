from uuid import UUID as _UUID
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt
from ..models import Event, Order, User
from ..extensions import db


class OrganizerDashboardResource(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        role = claims.get('role')
        sub = claims.get('sub') or claims.get('identity')
        try:
            uid = _UUID(str(sub))
        except Exception:
            return {"message": "Invalid token"}, 400
        if role not in ("organizer", "admin"):
            return {"message": "Forbidden"}, 403
        events_count = Event.query.filter_by(organizer_id=uid).count()
        orders_count = db.session.query(Order).join(Event, Order.event_id == Event.id).filter(Event.organizer_id == uid).count()
        return {
            "stats": {
                "events_count": events_count,
                "orders_count": orders_count,
            }
        }, 200


class AdminDashboardResource(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        role = claims.get('role')
        if role != 'admin':
            return {"message": "Forbidden"}, 403
        users_count = User.query.count()
        events_count = Event.query.count()
        orders_count = Order.query.count()
        return {
            "stats": {
                "users_count": users_count,
                "events_count": events_count,
                "orders_count": orders_count,
            }
        }, 200
