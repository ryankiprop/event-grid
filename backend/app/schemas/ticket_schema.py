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
    description = fields.Str(required=False, allow_none=True, default='')
    price = fields.Int(required=True, validate=validate.Range(min=0))
    quantity_total = fields.Int(required=True, validate=validate.Range(min=0))
    min_per_order = fields.Int(required=False, default=1, validate=validate.Range(min=1))
    max_per_order = fields.Int(required=False, default=10, validate=validate.Range(min=1))
    sale_start_date = fields.DateTime(required=False, allow_none=True)
    sale_end_date = fields.DateTime(required=False, allow_none=True)
    is_active = fields.Boolean(required=False, default=True)


class TicketTypeUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
    price = fields.Int()
    quantity_total = fields.Int()
