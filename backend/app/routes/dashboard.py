from uuid import UUID as _UUID

from flask import jsonify
from flask_jwt_extended import get_jwt, jwt_required

from ..extensions import db
from ..models.event import Event
from ..models.order import Order
from ..models.user import User

def init_app(app):
    @app.route('/api/dashboard/organizer', methods=['GET'])
    @jwt_required()
    def get_organizer_dashboard():
        claims = get_jwt()
        role = claims.get("role")
        sub = claims.get("sub") or claims.get("identity")
        try:
            uid = _UUID(str(sub))
        except Exception:
            return jsonify({"message": "Invalid token"}), 400
            
        if role not in ("organizer", "admin"):
            return jsonify({"message": "Forbidden"}), 403
            
        events_count = Event.query.filter_by(organizer_id=uid).count()
        orders_count = (
            db.session.query(Order)
            .join(Event, Order.event_id == Event.id)
            .filter(Event.organizer_id == uid)
            .count()
        )
        
        # Calculate revenue from completed orders
        revenue = db.session.query(db.func.sum(Order.total_amount))\
            .filter(Order.status == 'completed')\
            .join(Event, Order.event_id == Event.id)\
            .filter(Event.organizer_id == uid)\
            .scalar() or 0
            
        return jsonify({
            "stats": {
                "events_count": events_count,
                "orders_count": orders_count,
                "revenue": float(revenue) if revenue else 0,
            }
        })

    @app.route('/api/dashboard/admin', methods=['GET'])
    @jwt_required()
    def get_admin_dashboard():
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"message": "Forbidden"}), 403
            
        users_count = User.query.count()
        events_count = Event.query.count()
        orders_count = Order.query.count()
        
        # Calculate total revenue from all completed orders
        revenue = db.session.query(db.func.sum(Order.total_amount))\
            .filter(Order.status == 'completed')\
            .scalar() or 0
            
        return jsonify({
            "stats": {
                "users_count": users_count,
                "events_count": events_count,
                "orders_count": orders_count,
                "revenue": float(revenue) if revenue else 0,
            }
        })

    return app
