import inspect as pyinspect
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate, upgrade
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text

from config import Config

from .cli import register_cli
from .extensions import db, jwt, migrate
from .models.payment import Payment
from .routes import register_routes


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
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
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

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

    # Register routes
    register_routes(app)

    # Create upload folder if it doesn't exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

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
            {"name": "EventLync API", "status": "running", "version": "1.0.0"}
        )

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f"Server error: {str(error)}")
        return jsonify({"error": "Internal server error"}), 500

    @app.get("/api/health")
    def health():
        return {"status": "ok"}, 200

    @app.get("/health")
    def health_alias():
        return {"status": "ok"}, 200

    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', ', '.join(app.config['CORS_ORIGINS']))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    return app
