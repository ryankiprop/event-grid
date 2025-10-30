from flask_restx import Api

# Import all namespaces
from .routes.auth import auth_ns
from .routes.events import events_ns
from .routes.orders import orders_ns
from .routes.users import users_ns
from .routes.uploads import uploads_ns
from .routes.dashboard import dashboard_ns
from .routes.payments import payments_ns
from .routes.tickets import tickets_ns

# Initialize API
authorizations = {
    'Bearer Auth': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization',
        'description': 'Type "Bearer {token}" (without quotes)'
    }
}

api = Api(
    title='EventGrid API',
    version='1.0',
    description='A RESTful API for Event Management System',
    doc='/api/docs',
    authorizations=authorizations,
    security='Bearer Auth'
)

# Add namespaces to API
api.add_namespace(auth_ns, path='/api/auth')
api.add_namespace(events_ns, path='/api/events')
api.add_namespace(orders_ns, path='/api/orders')
api.add_namespace(users_ns, path='/api/users')
api.add_namespace(uploads_ns, path='/api/uploads')
api.add_namespace(dashboard_ns, path='/api/dashboard')
api.add_namespace(payments_ns, path='/api/payments')
api.add_namespace(tickets_ns, path='/api/tickets')
