from uuid import UUID as _UUID
from functools import wraps

from flask import request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    get_jwt,
    jwt_required as jwt_required_original,
)

from ..extensions import db
from ..models.user import User
from ..schemas.user_schema import UserCreateSchema, UserLoginSchema, UserSchema
from ..utils.auth import check_password, hash_password
from ..utils.email import send_welcome_email

# Initialize schemas
user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()

def jwt_required(*args, **kwargs):
    """Custom JWT required decorator that works with both function and method views"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args2, **kwargs2):
            # Call the original jwt_required decorator
            return jwt_required_original(*args, **kwargs)(lambda: fn(*args2, **kwargs2))()
        return wrapper
    return decorator

def role_required(roles):
    """Decorator to require specific user roles"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"message": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def init_app(app):
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json() or {}
        errors = user_create_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400

        email = data.get("email", "").lower()
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already registered"}), 400

        user = User(
            email=email,
            password_hash=hash_password(data.get("password")),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role="user",
        )
        db.session.add(user)
        db.session.commit()

        # Send welcome email (fire and forget)
        try:
            send_welcome_email(user)
        except Exception as e:
            current_app.logger.error(f"Failed to send welcome email: {str(e)}")

        return jsonify(user_schema.dump(user)), 201

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        errors = user_login_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400

        user = User.query.filter_by(email=data["email"].lower()).first()
        if not user or not check_password(data["password"], user.password_hash):
            return jsonify({"message": "Invalid email or password"}), 401

        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return jsonify({
            "token": access_token,  # Changed from access_token to token to match frontend
            "user": user_schema.dump(user)
        }), 200

    @app.route('/api/auth/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify(user_schema.dump(user))

    @app.route('/api/auth/me', methods=['PUT'])
    @jwt_required()
    def update_current_user():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json() or {}
        
        # Update user fields if provided
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data and data['email'].lower() != user.email:
            if User.query.filter_by(email=data['email'].lower()).first():
                return jsonify({"message": "Email already in use"}), 400
            user.email = data['email'].lower()
        if 'password' in data and data['password']:
            user.password_hash = hash_password(data['password'])
        
        db.session.commit()
        return jsonify(user_schema.dump(user))

    @app.route('/api/auth/register/organizer', methods=['POST'])
    @jwt_required()
    @role_required(['admin'])
    def register_organizer():
        data = request.get_json() or {}
        errors = user_create_schema.validate(data)
        if errors:
            return jsonify({"errors": errors}), 400

        email = data.get("email", "").lower()
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already registered"}), 400

        user = User(
            email=email,
            password_hash=hash_password(data.get("password")),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role="organizer",
        )
        db.session.add(user)
        db.session.commit()

        # Send welcome email (fire and forget)
        try:
            send_welcome_email(user, is_organizer=True)
        except Exception as e:
            current_app.logger.error(f"Failed to send welcome email: {str(e)}")

        return jsonify(user_schema.dump(user)), 201

    return app