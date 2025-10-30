from .auth import init_app as init_auth
from .events import init_app as init_events
from .orders import init_app as init_orders
from .payments import init_app as init_payments
from .dashboard import init_app as init_dashboard
from .tickets import init_app as init_tickets
from .uploads import init_app as init_uploads
from .users import init_app as init_users
from .swagger import init_app as init_swagger

def init_app(app):
    """Initialize all routes with the Flask app."""
    # Initialize all route modules
    init_auth(app)
    init_events(app)
    init_orders(app)
    init_payments(app)
    init_dashboard(app)
    init_tickets(app)
    init_uploads(app)
    init_users(app)
    init_swagger(app)
    
    return app
