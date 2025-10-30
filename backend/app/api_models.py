from flask_restx import fields, Model

# Common response models
error_model = Model('Error', {
    'message': fields.String(description='Error message')
})

# Auth models
login_model = Model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

user_model = Model('User', {
    'id': fields.String(description='User ID'),
    'username': fields.String(description='Username'),
    'email': fields.String(description='Email address'),
    'role': fields.String(description='User role (admin, organizer, user)'),
    'created_at': fields.DateTime(description='Creation timestamp')
})

# Event models
event_model = Model('Event', {
    'id': fields.String(description='Event ID'),
    'title': fields.String(required=True, description='Event title'),
    'description': fields.String(description='Event description'),
    'start_time': fields.DateTime(required=True, description='Event start time'),
    'end_time': fields.DateTime(required=True, description='Event end time'),
    'location': fields.String(required=True, description='Event location'),
    'image_url': fields.String(description='Event image URL'),
    'organizer_id': fields.String(description='ID of the event organizer'),
    'created_at': fields.DateTime(description='Creation timestamp'),
    'updated_at': fields.DateTime(description='Last update timestamp')
})

# Ticket models
ticket_type_model = Model('TicketType', {
    'id': fields.String(description='Ticket type ID'),
    'name': fields.String(required=True, description='Ticket type name'),
    'price': fields.Float(required=True, description='Ticket price'),
    'quantity_available': fields.Integer(description='Number of available tickets'),
    'event_id': fields.String(description='Associated event ID')
})

# Order models
order_item_model = Model('OrderItem', {
    'id': fields.String(description='Order item ID'),
    'ticket_type_id': fields.String(description='Ticket type ID'),
    'quantity': fields.Integer(description='Number of tickets'),
    'unit_price': fields.Float(description='Price per ticket'),
    'qr_code': fields.String(description='QR code data for ticket validation')
})

order_model = Model('Order', {
    'id': fields.String(description='Order ID'),
    'user_id': fields.String(description='User ID who placed the order'),
    'status': fields.String(description='Order status (pending, paid, cancelled)'),
    'total_amount': fields.Float(description='Total order amount'),
    'created_at': fields.DateTime(description='Order creation timestamp'),
    'items': fields.List(fields.Nested(order_item_model), description='Order items')
})

# Upload models
upload_response_model = Model('UploadResponse', {
    'url': fields.String(description='URL of the uploaded file'),
    'public_id': fields.String(description='Cloudinary public ID'),
    'format': fields.String(description='File format'),
    'bytes': fields.Integer(description='File size in bytes')
})
