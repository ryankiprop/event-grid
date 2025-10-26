from uuid import UUID as _UUID
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt
from ..models import User
from ..extensions import db
from ..schemas import UserSchema

user_schema = UserSchema()
users_schema = UserSchema(many=True)


def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None


class UsersListResource(Resource):
    @jwt_required()
    def get(self):
        claims = get_jwt()
        role = claims.get('role')
        if role != 'admin':
            return {"message": "Forbidden"}, 403
        users = User.query.order_by(User.created_at.desc()).all()
        return {"users": users_schema.dump(users)}, 200


class UserRoleResource(Resource):
    @jwt_required()
    def put(self, user_id):
        claims = get_jwt()
        role = claims.get('role')
        if role != 'admin':
            return {"message": "Forbidden"}, 403
        uid = _uuid(user_id)
        if not uid:
            return {"message": "Invalid user id"}, 400
        user = User.query.get(uid)
        if not user:
            return {"message": "User not found"}, 404
        data = request.get_json() or {}
        new_role = data.get('role')
        if new_role not in ('admin', 'organizer', 'user'):
            return {"message": "Invalid role"}, 400
        user.role = new_role
        db.session.commit()
        return {"user": user_schema.dump(user)}, 200