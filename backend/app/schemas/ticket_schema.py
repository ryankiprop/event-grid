from marshmallow import Schema, fields, validate


class TicketTypeSchema(Schema):
    id = fields.UUID(dump_only=True)
    event_id = fields.UUID(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    price = fields.Int(required=True)
    quantity_total = fields.Int(required=True)
    quantity_sold = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TicketTypeCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    price = fields.Int(required=True)
    quantity_total = fields.Int(required=True)


class TicketTypeUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
    price = fields.Int()
    quantity_total = fields.Int()
