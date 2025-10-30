import inspect as pyinspect
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate, upgrade
from flask_sqlalchemy import SQLAlchemy
from marshmallow import ValidationError
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from config import Config

from .cli import register_cli
from .extensions import db, jwt, migrate
from .models.payment import Payment

# Import API after app to avoid circular imports
from .api import init_app as init_api

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure logging
    if not app.debug:
        import logging
        from logging.handlers import RotatingFileHandler
        
        # Ensure log directory exists
        os.makedirs('logs', exist_ok=True)
        
        # File handler with rotation
        file_handler = RotatingFileHandler('logs/eventgrid.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('EventGrid startup')

    # Initialize extensions
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
        strategy="fixed-window",
        headers_enabled=True
    )
    
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "supports_credentials": True,
                "allow_headers": ["Content-Type", "Authorization"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }
        }
    )
    
    # Initialize database and migrations
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Initialize API with blueprints
    app = init_api(app)

    def _called_from_alembic_env():
        try:
            for f in pyinspect.stack():
                fname = (
                    f.filename.replace("\\", "/")
                    if f and getattr(f, "filename", None)
                    else ""
                )
                if fname.endswith("/migrations/env.py"):
                    return True
        except Exception:
            pass
        return False

    if not _called_from_alembic_env() and (
        os.environ.get("RUN_MIGRATIONS_ON_START") or ""
    ).lower() in ("1", "true", "yes"):
        try:
            with app.app_context():
                upgrade()
        except Exception as e:
            app.logger.error(f"Migration failed: {str(e)}")

    # Create upload folder if it doesn't exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    
    # Register error handlers
    @app.errorhandler(400)
    def bad_request_error(error):
        app.logger.error(f'Bad request: {str(error)}')
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error)
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'You do not have permission to perform this action'
        }), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {str(error)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500

    # Import SQLAlchemy's IntegrityError
    from sqlalchemy.exc import IntegrityError

    # Handle database errors
    @app.errorhandler(IntegrityError)
    def handle_db_integrity_error(error):
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Database Integrity Error',
            'message': str(error.orig) if hasattr(error, 'orig') else 'A database integrity error occurred'
        }), 400

    # Handle validation errors
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': str(error),
            'errors': error.messages if hasattr(error, 'messages') else None
        }), 400

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Ensure database connections are properly closed."""
        db.session.remove()

    # Ensure database tables exist
    with app.app_context():
        try:
            # This will create any tables that don't exist
            db.create_all()
            app.logger.info("Database tables verified/created successfully")
        except Exception as e:
            app.logger.error(f"Error initializing database: {str(e)}")
            # Don't raise here to allow the app to start in read-only mode

    @app.route("/health")
    def health_check():
        try:
            # Test database connection
            db.session.execute(text("SELECT 1"))
            return jsonify({"status": "healthy", "database": "connected"}), 200
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return (
                jsonify(
                    {"status": "unhealthy", "database": "disconnected", "error": str(e)}
                ),
                500,
            )

    @app.route("/")
    def index():
        return jsonify(
            {"name": "EventGrid API", "status": "running", "version": "1.0.0"}
        )

    # Add CORS preflight handler
    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        return '', 200, {
            'Access-Control-Allow-Origin': ', '.join(app.config['CORS_ORIGINS']),
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        }

    # Register CLI commands
    register_cli(app)

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"message": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f"Server error: {str(error)}")
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.route("/health")
    def health_alias():
        return jsonify({"status": "ok"}), 200

    return app