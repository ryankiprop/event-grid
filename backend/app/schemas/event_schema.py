from marshmallow import Schema, fields, validate


class EventSchema(Schema):
    id = fields.UUID(dump_only=True)
    organizer_id = fields.UUID(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    description = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    venue_name = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    banner_image_url = fields.Url(allow_none=True)
    is_published = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class EventCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    description = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    venue_name = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    banner_image_url = fields.Url(allow_none=True)
    is_published = fields.Bool(load_default=False)


class EventUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=3, max=255))
    description = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    venue_name = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    start_date = fields.DateTime()
    end_date = fields.DateTime()
    banner_image_url = fields.Url(allow_none=True)
    is_published = fields.Bool()
