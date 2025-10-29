# Import order is important to avoid circular imports
# Use string-based imports for relationships to avoid circular imports

# Import all models
from .user import User
from .event import Event
from .ticket import TicketType
from .order import Order, OrderItem
from .payment import Payment
from .media import Media

# This allows for `from app.models import User, Event, etc.`
__all__ = [
    'User',
    'Event',
    'TicketType',
    'Order',
    'OrderItem',
    'Payment',
    'Media',
]
