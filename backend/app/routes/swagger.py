from flask_restful import Resource

SWAGGER_SPEC = {
  "openapi": "3.0.0",
  "info": {"title": "Eventgrid API", "version": "0.1.0"},
  "paths": {
    "/api/auth/register": {"post": {"summary": "Register"}},
    "/api/auth/login": {"post": {"summary": "Login"}},
    "/api/auth/me": {"get": {"summary": "Current user"}},
    "/api/events": {"get": {"summary": "List events"}, "post": {"summary": "Create event"}},
    "/api/events/{id}": {"get": {"summary": "Get event"}, "put": {"summary": "Update event"}, "delete": {"summary": "Delete event"}},
    "/api/events/{id}/tickets": {"get": {"summary": "List tickets"}, "post": {"summary": "Create ticket type"}},
    "/api/orders": {"post": {"summary": "Create order"}},
    "/api/orders/user": {"get": {"summary": "My orders"}},
    "/api/orders/{id}": {"get": {"summary": "Order details"}},
    "/api/dashboard/organizer": {"get": {"summary": "Organizer dashboard"}},
    "/api/dashboard/admin": {"get": {"summary": "Admin dashboard"}},
    "/api/users": {"get": {"summary": "List users"}},
    "/api/users/{id}/role": {"put": {"summary": "Change user role"}}
  }
}

class SwaggerSpecResource(Resource):
  def get(self):
    return SWAGGER_SPEC, 200