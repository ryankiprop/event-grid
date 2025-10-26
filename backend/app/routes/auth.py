from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..schemas import UserSchema, UserCreateSchema, UserLoginSchema
from ..utils.auth import hash_password, check_password
from uuid import UUID as _UUID

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()


class RegisterResource(Resource):
    def post(self):
        json_data = request.get_json() or {}
        errors = user_create_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400

        email = json_data.get("email").lower()
        if User.query.filter_by(email=email).first():
            return {"message": "Email already registered"}, 400

        pw_hash = hash_password(json_data.get("password"))
        user = User(
            email=email,
            password_hash=pw_hash,
            first_name=json_data.get("first_name"),
            last_name=json_data.get("last_name"),
            role="user",
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return {"token": token, "user": user_schema.dump(user)}, 201


class LoginResource(Resource):
    def post(self):
        json_data = request.get_json() or {}
        errors = user_login_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400

        email = json_data.get("email").lower()
        password = json_data.get("password")

        user = User.query.filter_by(email=email).first()
        if not user or not check_password(password, user.password_hash):
            return {"message": "Invalid credentials"}, 401

        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return {"token": token, "user": user_schema.dump(user)}, 200


class MeResource(Resource):
    @jwt_required()
    def get(self):
        identity = get_jwt_identity()
        try:
            user_uuid = _UUID(str(identity))
        except Exception:
            return {"message": "Invalid token identity"}, 400
        user = User.query.get(user_uuid)
        if not user:
            return {"message": "User not found"}, 404
        return {"user": user_schema.dump(user)}, 200


class RegisterOrganizerResource(Resource):
    def post(self):
        json_data = request.get_json() or {}
        errors = user_create_schema.validate(json_data)
        if errors:
            return {"errors": errors}, 400

        email = json_data.get("email").lower()
        if User.query.filter_by(email=email).first():
            return {"message": "Email already registered"}, 400

        pw_hash = hash_password(json_data.get("password"))
        user = User(
            email=email,
            password_hash=pw_hash,
            first_name=json_data.get("first_name"),
            last_name=json_data.get("last_name"),
            role="organizer",
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return {"token": token, "user": user_schema.dump(user)}, 201