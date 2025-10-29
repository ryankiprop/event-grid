from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    id = fields.UUID(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str()
    last_name = fields.Str()
    role = fields.Str(validate=validate.OneOf(["admin", "organizer", "user"]))
    avatar_url = fields.Url(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(
        required=True, load_only=True, validate=validate.Length(min=6)
    )
    first_name = fields.Str(required=False)
    last_name = fields.Str(required=False)


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
