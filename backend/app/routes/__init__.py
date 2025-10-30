from flask import Blueprint
from .auth import auth_bp
from .events import events_bp
from .orders import orders_bp
from .payments import payments_bp
from .dashboard import dashboard_bp
# Import other blueprints as they are converted
# from .tickets import tickets_bp
# from .uploads import uploads_bp
# from .users import users_bp

def register_routes(app):
    """Register all routes with the Flask app."""
    # Register API blueprints with their respective URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(events_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    app.register_blueprint(payments_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    
    # Register other blueprints as they are converted
    # app.register_blueprint(tickets_bp, url_prefix='/api')
    # app.register_blueprint(uploads_bp, url_prefix='/api')
    # app.register_blueprint(users_bp, url_prefix='/api')
