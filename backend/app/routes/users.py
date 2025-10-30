from uuid import UUID as _UUID

from flask import request, jsonify
from flask_jwt_extended import get_jwt, jwt_required

from ..extensions import db
from ..models.user import User
from ..schemas import UserSchema

user_schema = UserSchema()
users_schema = UserSchema(many=True)

def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None

def init_app(app):
    @app.route('/api/users', methods=['GET'])
    @jwt_required()
    def get_users():
        claims = get_jwt()
        role = claims.get("role")
        if role != "admin":
            return jsonify({"message": "Forbidden"}), 403
            
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({"users": users_schema.dump(users)})

    @app.route('/api/users/<user_id>/role', methods=['PUT'])
    @jwt_required()
    def update_user_role(user_id):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"message": "Forbidden"}), 403
            
        user = User.query.get(_uuid(user_id))
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        data = request.get_json() or {}
        new_role = data.get("role")
        
        if new_role not in ["user", "organizer", "admin"]:
            return jsonify({"message": "Invalid role"}), 400
            
        user.role = new_role
        db.session.commit()
        
        return jsonify({
            "message": "User role updated successfully", 
            "user": user_schema.dump(user)
        })

    return app
