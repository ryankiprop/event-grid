def init_app(app):
    # Import routes to register them with the app
    from .routes import auth, events, orders, users, uploads, dashboard, payments
    
    # Initialize routes
    auth.init_app(app)
    events.init_app(app)
    orders.init_app(app)
    users.init_app(app)
    uploads.init_app(app)
    dashboard.init_app(app)
    payments.init_app(app)
    
    return app
