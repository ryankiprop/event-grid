from flask import Blueprint
from flask_restful import Api

from .auth import LoginResource, MeResource, RegisterOrganizerResource, RegisterResource
from .dashboard import AdminDashboardResource, OrganizerDashboardResource
from .events import EventResource, EventsListResource, EventStatsResource
from .orders import (
    EventOrdersResource,
    MarkCheckinResource,
    OrderDetailResource,
    OrdersResource,
    UserOrdersResource,
    VerifyCheckinResource,
)
from .payments import (
    MpesaCallbackResource,
    MpesaInitiateResource,
    MpesaTestEnvResource,
    PaymentStatusResource,
)
from .swagger import SwaggerSpecResource
from .tickets import EventTicketsResource
from .uploads import ImageUploadResource
from .users import UserRoleResource, UsersListResource


def register_routes(app):
    api_bp = Blueprint("api", __name__, url_prefix="/api")
    api = Api(api_bp)

    # Auth endpoints
    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(RegisterOrganizerResource, "/auth/register-organizer")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(MeResource, "/auth/me")

    # Events endpoints
    api.add_resource(EventsListResource, "/events")
    api.add_resource(EventResource, "/events/<string:event_id>")
    api.add_resource(EventStatsResource, "/events/<string:event_id>/stats")

    # Tickets endpoints
    api.add_resource(EventTicketsResource, "/events/<string:event_id>/tickets")

    # Orders endpoints
    api.add_resource(OrdersResource, "/orders")
    api.add_resource(UserOrdersResource, "/orders/user")
    api.add_resource(OrderDetailResource, "/orders/<string:order_id>")
    api.add_resource(EventOrdersResource, "/events/<string:event_id>/orders")
    api.add_resource(VerifyCheckinResource, "/checkin/verify")
    api.add_resource(MarkCheckinResource, "/checkin/mark")

    # Payments - M-Pesa
    api.add_resource(MpesaInitiateResource, "/payments/mpesa/initiate")
    api.add_resource(PaymentStatusResource, "/payments/<string:payment_id>")
    api.add_resource(MpesaCallbackResource, "/payments/mpesa/callback")
    api.add_resource(MpesaTestEnvResource, "/payments/mpesa/test-env")

    # Dashboard endpoints
    api.add_resource(OrganizerDashboardResource, "/dashboard/organizer")
    api.add_resource(AdminDashboardResource, "/dashboard/admin")

    # Admin - Users
    api.add_resource(UsersListResource, "/users")
    api.add_resource(UserRoleResource, "/users/<string:user_id>/role")

    # Swagger
    api.add_resource(SwaggerSpecResource, "/docs/swagger.json")

    # Uploads
    api.add_resource(ImageUploadResource, "/uploads/image")

    app.register_blueprint(api_bp)
