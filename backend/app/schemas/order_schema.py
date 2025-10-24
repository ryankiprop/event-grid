from marshmallow import Schema, fields


class OrderItemSchema(Schema):
    id = fields.UUID(dump_only=True)
    ticket_type_id = fields.UUID(required=True)
    quantity = fields.Int(required=True)
    unit_price = fields.Int(dump_only=True)
    qr_code = fields.Str(dump_only=True)
    checked_in = fields.Bool(dump_only=True)
    checked_in_at = fields.DateTime(dump_only=True, allow_none=True)
    checked_in_by = fields.UUID(dump_only=True, allow_none=True)


class OrderSchema(Schema):
    id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True)
    event_id = fields.UUID(required=True)
    total_amount = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)
    items = fields.List(fields.Nested(OrderItemSchema))
    created_at = fields.DateTime(dump_only=True)


class CreateOrderSchema(Schema):
    event_id = fields.UUID(required=True)
    items = fields.List(fields.Nested(OrderItemSchema), required=True)
