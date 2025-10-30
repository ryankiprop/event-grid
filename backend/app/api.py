from flask import Blueprint

# Import all blueprints
from .routes.auth import auth_bp
from .routes.events import events_bp
from .routes.orders import orders_bp
from .routes.users import users_bp
from .routes.uploads import uploads_bp
from .routes.dashboard import dashboard_bp
from .routes.payments import payments_bp

def init_app(app):
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    
    return app
