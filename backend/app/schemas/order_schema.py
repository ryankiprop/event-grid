from marshmallow import Schema, fields, EXCLUDE
from ..utils.qrcode_util import generate_ticket_qr
from ..models.ticket import TicketType

class TicketTypeSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    id = fields.UUID(dump_only=True)
    name = fields.Str()
    description = fields.Str()
    price = fields.Int()
    quantity_total = fields.Int()
    quantity_available = fields.Int()

class EventSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    id = fields.UUID(dump_only=True)
    title = fields.Str()
    description = fields.Str()
    start_date = fields.DateTime()
    end_date = fields.DateTime()
    venue_name = fields.Str()
    address = fields.Str()
    banner_image_url = fields.Str(allow_none=True)

class OrderItemSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    id = fields.UUID(dump_only=True)
    ticket_type_id = fields.UUID(required=True)
    ticket_type = fields.Nested(TicketTypeSchema, dump_only=True)
    quantity = fields.Int(required=True)
    unit_price = fields.Int(dump_only=True)
    qr_code = fields.Method("get_qr_code", dump_only=True)
    checked_in = fields.Bool(dump_only=True)
    checked_in_at = fields.DateTime(dump_only=True, allow_none=True)
    checked_in_by = fields.UUID(dump_only=True, allow_none=True)

    def get_qr_code(self, obj):
        order = getattr(obj, "order", None)
        if order is None:
            return None
        if getattr(order, "status", None) == "paid":
            return obj.qr_code
        return None

class OrderSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        
    id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True)
    event_id = fields.UUID(required=True)
    event = fields.Nested(EventSchema, dump_only=True)
    total_amount = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)
    items = fields.Method("get_items", dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_items(self, obj):
        if getattr(obj, "status", None) == "paid":
            return OrderItemSchema(many=True).dump(getattr(obj, "items", []) or [])
        return []

class CreateOrderSchema(Schema):
    event_id = fields.UUID(required=True)
    items = fields.List(fields.Nested(OrderItemSchema(only=('ticket_type_id', 'quantity'))), required=True)
