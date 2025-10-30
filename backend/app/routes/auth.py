from uuid import UUID as _UUID

from flask import request, current_app
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_restx import Namespace, Resource, fields

from ..extensions import db
from ..models import User
from ..schemas import UserCreateSchema, UserLoginSchema, UserSchema
from ..utils.auth import check_password, hash_password
from ..utils.email import send_welcome_email  # Add this import

# Create a namespace for auth routes
auth_ns = Namespace('auth', description='Authentication operations')

# Import models
from ..api_models import user_model, login_model, error_model

# Add models to namespace
auth_ns.models[user_model.name] = user_model
auth_ns.models[login_model.name] = login_model
auth_ns.models[error_model.name] = error_model

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()

@auth_ns.route('/register')
@auth_ns.doc(security=None)
class RegisterResource(Resource):
    @auth_ns.doc('register_user')
    @auth_ns.expect(auth_ns.model('Register', {
        'email': fields.String(required=True, description='User email'),
        'password': fields.String(required=True, description='Password (min 8 characters)'),
        'first_name': fields.String(required=True, description='First name'),
        'last_name': fields.String(required=True, description='Last name')
    }))
    @auth_ns.response(201, 'User registered successfully', user_model)
    @auth_ns.response(400, 'Invalid input', error_model)
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

        # Send welcome email (fire and forget)
        try:
            send_welcome_email(user)
        except Exception as e:
            # Log the error but don't fail the registration
            current_app.logger.error(f"Failed to send welcome email: {str(e)}")

        token = create_access_token(
            identity=str(user.id), additional_claims={"role": user.role}
        )
        return {"token": token, "user": user_schema.dump(user)}, 201

@auth_ns.route('/login')
@auth_ns.doc(security=None)
class LoginResource(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(login_model)
    @auth_ns.response(200, 'Login successful', {
        'token': fields.String(description='JWT access token'),
        'user': fields.Nested(user_model)
    })
    @auth_ns.response(400, 'Invalid credentials', error_model)
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

        token = create_access_token(
            identity=str(user.id), additional_claims={"role": user.role}
        )
        return {"token": token, "user": user_schema.dump(user)}, 200

@auth_ns.route('/me')
class MeResource(Resource):
    @auth_ns.doc(security='Bearer Auth')
    @auth_ns.response(200, 'Success', user_model)
    @auth_ns.response(401, 'Unauthorized', error_model)
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
        return user_schema.dump(user), 200
        
    @auth_ns.doc(security='Bearer Auth')
    @auth_ns.expect(auth_ns.model('UpdateProfile', {
        'first_name': fields.String(description='New first name'),
        'last_name': fields.String(description='New last name')
    }))
    @auth_ns.response(200, 'Profile updated', user_model)
    @auth_ns.response(400, 'Invalid input', error_model)
    @auth_ns.response(401, 'Unauthorized', error_model)
    @jwt_required()
    def put(self):
        identity = get_jwt_identity()
        try:
            user_uuid = _UUID(str(identity))
        except Exception:
            return {"message": "Invalid token identity"}, 400
            
        user = User.query.get(user_uuid)
        if not user:
            return {"message": "User not found"}, 404
            
        json_data = request.get_json() or {}
        
        # Update allowed fields
        if 'first_name' in json_data:
            user.first_name = json_data['first_name']
        if 'last_name' in json_data:
            user.last_name = json_data['last_name']
        if 'avatar_url' in json_data:
            user.avatar_url = json_data['avatar_url']
            
        db.session.commit()
        
        return {"message": "Profile updated successfully", "user": user_schema.dump(user)}, 200

@auth_ns.route('/register-organizer')
class RegisterOrganizerResource(Resource):
    @auth_ns.doc(security='Bearer Auth')
    @auth_ns.expect(auth_ns.model('RegisterOrganizer', {
        'email': fields.String(required=True, description='Organizer email'),
        'password': fields.String(required=True, description='Password (min 8 characters)'),
        'first_name': fields.String(required=True, description='First name'),
        'last_name': fields.String(required=True, description='Last name'),
        'organization': fields.String(required=True, description='Organization name')
    }))
    @auth_ns.response(201, 'Organizer registered successfully', user_model)
    @auth_ns.response(400, 'Invalid input', error_model)
    @auth_ns.response(401, 'Unauthorized', error_model)
    @auth_ns.response(403, 'Forbidden', error_model)
    @jwt_required()
    def post(self):
        # Check if current user is admin
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role != 'admin':
            return {"message": "Only admin can register organizers"}, 403

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
            organization=json_data.get("organization")
        )
        db.session.add(user)
        db.session.commit()

        # Send welcome email to organizer
        try:
            send_welcome_email(user)
        except Exception as e:
            current_app.logger.error(f"Failed to send welcome email to organizer: {str(e)}")

        return {"message": "Organizer registered successfully", "user": user_schema.dump(user)}, 201