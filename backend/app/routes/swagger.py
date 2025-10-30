from flask import jsonify

SWAGGER_SPEC = {
    "openapi": "3.0.0",
    "info": {"title": "Eventgrid API", "version": "0.1.0"},
    "paths": {
        "/api/auth/register": {"post": {"summary": "Register"}},
        "/api/auth/login": {"post": {"summary": "Login"}},
        "/api/auth/me": {"get": {"summary": "Current user"}},
        "/api/events": {
            "get": {"summary": "List events"},
            "post": {"summary": "Create event"},
        },
        "/api/events/<uuid:id>": {
            "get": {"summary": "Get event"},
            "put": {"summary": "Update event"},
            "delete": {"summary": "Delete event"},
        },
        "/api/events/<uuid:id>/tickets": {
            "get": {"summary": "List tickets"},
            "post": {"summary": "Create ticket type"},
        },
        "/api/orders": {"post": {"summary": "Create order"}},
        "/api/orders/user": {"get": {"summary": "My orders"}},
        "/api/orders/<uuid:id>": {"get": {"summary": "Order details"}},
        "/api/orders/event/<uuid:event_id>": {"get": {"summary": "Get event orders"}},
        "/api/orders/verify-checkin": {"post": {"summary": "Verify check-in"}},
        "/api/orders/check-in": {"post": {"summary": "Mark check-in"}},
        "/api/dashboard/organizer": {"get": {"summary": "Organizer dashboard"}},
        "/api/dashboard/admin": {"get": {"summary": "Admin dashboard"}},
        "/api/users": {"get": {"summary": "List users"}},
        "/api/users/<uuid:id>/role": {"put": {"summary": "Change user role"}},
        "/api/uploads/image": {"post": {"summary": "Upload image"}},
        "/api/docs": {"get": {"summary": "API Documentation"}},
    },
}

def init_app(app):
    @app.route('/api/docs', methods=['GET'])
    def get_swagger_spec():
        return jsonify(SWAGGER_SPEC), 200
        
    return app
