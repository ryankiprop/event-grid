from uuid import UUID as _UUID

from flask import request, Blueprint, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from ..extensions import db
from ..models import User
from ..schemas import UserCreateSchema, UserLoginSchema, UserSchema
from ..utils.auth import check_password, hash_password
from ..utils.email import send_welcome_email

# Create a blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    json_data = request.get_json() or {}
    errors = user_create_schema.validate(json_data)
    if errors:
        return jsonify({"errors": errors}), 400

    email = json_data.get("email").lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

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
        from flask import current_app
        current_app.logger.error(f"Failed to send welcome email: {str(e)}")

    token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )
    return jsonify({"token": token, "user": user_schema.dump(user)}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    json_data = request.get_json() or {}
    errors = user_login_schema.validate(json_data)
    if errors:
        return jsonify({"errors": errors}), 400

    email = json_data.get("email").lower()
    password = json_data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )
    return jsonify({"token": token, "user": user_schema.dump(user)}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    identity = get_jwt_identity()
    try:
        user_uuid = _UUID(str(identity))
    except Exception:
        return jsonify({"message": "Invalid token identity"}), 400
        
    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify(user_schema.dump(user)), 200

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    identity = get_jwt_identity()
    try:
        user_uuid = _UUID(str(identity))
    except Exception:
        return jsonify({"message": "Invalid token identity"}), 400
            
    user = User.query.get(user_uuid)
    if not user:
        return jsonify({"message": "User not found"}), 404
            
    json_data = request.get_json() or {}
    
    # Update allowed fields
    if 'first_name' in json_data:
        user.first_name = json_data['first_name']
    if 'last_name' in json_data:
        user.last_name = json_data['last_name']
    if 'avatar_url' in json_data:
        user.avatar_url = json_data['avatar_url']
            
    db.session.commit()
    
    return jsonify({"message": "Profile updated successfully", "user": user_schema.dump(user)}), 200

@auth_bp.route('/register-organizer', methods=['POST'])
@jwt_required()
def register_organizer():
    # Check if current user is admin
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({"message": "Only admin can register organizers"}), 403

    json_data = request.get_json() or {}
    errors = user_create_schema.validate(json_data)
    if errors:
        return jsonify({"errors": errors}), 400

    email = json_data.get("email").lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

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
        from flask import current_app
        current_app.logger.error(f"Failed to send welcome email to organizer: {str(e)}")

    token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role}
    )
    return jsonify({"token": token, "user": user_schema.dump(user)}), 201