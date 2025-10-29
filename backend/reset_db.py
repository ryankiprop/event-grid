"""Script to reset the database and seed with fresh data"""
import os
import sys
import uuid
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models import Event, Order, OrderItem, Payment, TicketType, User

def drop_tables():
    """Drop all database tables"""
    print("Dropping all database tables...")
    db.drop_all()
    db.session.commit()
    print("All tables dropped successfully!")

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    db.create_all()
    print("Database tables created successfully!")

def seed_data():
    """Seed the database with initial data"""
    print("Seeding initial data...")
    
    # Create admin user
    admin = User(
        email="admin@eventgrid.com",
        password_hash=generate_password_hash("Admin@123"),
        first_name="Admin",
        last_name="User",
        role="admin"
    )
    db.session.add(admin)
    
    # Create regular users
    users = [
        User(
            email="user1@eventgrid.com",
            password_hash=generate_password_hash("User@123"),
            first_name="John",
            last_name="Doe"
        ),
        User(
            email="user2@eventgrid.com",
            password_hash=generate_password_hash("User@123"),
            first_name="Jane",
            last_name="Smith"
        )
    ]
    db.session.add_all(users)
    
    # Create organizer users
    organizers = [
        User(
            email="organizer@eventgrid.com",
            password_hash=generate_password_hash("Organizer@123"),
            first_name="Event",
            last_name="Organizer",
            role="organizer"
        ),
        User(
            email="events@nairobi.com",
            password_hash=generate_password_hash("Organizer@123"),
            first_name="Nairobi",
            last_name="Events",
            role="organizer"
        )
    ]
    db.session.add_all(organizers)
    db.session.commit()
    
    # Create sample events
    events = [
        # Admin's events
        {
            "title": "Tech Conference 2023",
            "description": "Annual technology conference featuring the latest in software development, AI, and cloud computing.",
            "start_date": datetime.now() + timedelta(days=30),
            "end_date": datetime.now() + timedelta(days=31),
            "venue_name": "Nairobi Convention Center",
            "address": "Nairobi, Kenya",
            "category": "Technology",
            "is_published": True,
            "organizer_id": admin.id,
            "ticket_types": [
                {"name": "Early Bird", "price": 5000, "quantity": 50},
                {"name": "Standard", "price": 7500, "quantity": 100},
                {"name": "VIP", "price": 15000, "quantity": 20}
            ]
        },
        {
            "title": "Startup Pitch Competition",
            "description": "Pitch your startup to investors and win amazing prizes.",
            "start_date": datetime.now() + timedelta(days=60),
            "end_date": datetime.now() + timedelta(days=60),
            "venue_name": "iHub Nairobi",
            "address": "Nairobi, Kenya",
            "category": "Business",
            "is_published": True,
            "organizer_id": admin.id,
            "ticket_types": [
                {"name": "General Admission", "price": 2000, "quantity": 100},
                {"name": "Investor Pass", "price": 10000, "quantity": 20}
            ]
        },
        
        # Organizer's events
        {
            "title": "Nairobi Music Festival",
            "description": "Annual music festival featuring top artists from around the world.",
            "start_date": datetime.now() + timedelta(days=45),
            "end_date": datetime.now() + timedelta(days=47),
            "venue_name": "Carnivore Grounds",
            "address": "Nairobi, Kenya",
            "category": "Music",
            "is_published": True,
            "organizer_id": organizers[0].id,
            "ticket_types": [
                {"name": "Single Day Pass", "price": 3000, "quantity": 500},
                {"name": "Weekend Pass", "price": 7500, "quantity": 300},
                {"name": "VIP Experience", "price": 15000, "quantity": 50}
            ]
        },
        {
            "title": "Food & Wine Expo",
            "description": "Experience the finest food and wine from around the world.",
            "start_date": datetime.now() + timedelta(days=75),
            "end_date": datetime.now() + timedelta(days=77),
            "venue_name": "KICC",
            "address": "Nairobi, Kenya",
            "category": "Food & Drink",
            "is_published": True,
            "organizer_id": organizers[1].id,
            "ticket_types": [
                {"name": "Tasting Pass", "price": 2500, "quantity": 200},
                {"name": "Premium Tasting", "price": 5000, "quantity": 100},
                {"name": "Masterclass Access", "price": 10000, "quantity": 30}
            ]
        }
    ]
    
    # Create events and ticket types
    created_events = []
    created_ticket_types = []
    
    for event_data in events:
        ticket_types_data = event_data.pop('ticket_types', [])
        event = Event(**event_data)
        db.session.add(event)
        db.session.flush()  # Get the event ID
        
        # Create ticket types for the event
        for tt_data in ticket_types_data:
            # Convert quantity to quantity_total for the TicketType model
            tt_data['quantity_total'] = tt_data.pop('quantity', 0)
            ticket_type = TicketType(
                event_id=event.id,
                quantity_sold=0,  # Initialize quantity_sold
                **tt_data
            )
            db.session.add(ticket_type)
            created_ticket_types.append(ticket_type)
        
        created_events.append(event)
    
    db.session.commit()
    
    # Create sample orders only if we have ticket types
    if created_ticket_types:
        orders = [
            {
                "user_id": users[0].id,
                "event_id": created_events[0].id,  # First event
                "status": "completed",
                "total_amount": 10000,  # in cents
                "items": [
                    {
                        "ticket_type_id": created_ticket_types[0].id,
                        "quantity": 2,
                        "unit_price": created_ticket_types[0].price,
                        "qr_code": f"QR-{uuid.uuid4()}"
                    }
                ]
            },
            {
                "user_id": users[1].id,
                "event_id": created_events[1].id,  # Second event
                "status": "pending",
                "total_amount": 15000,  # in cents
                "items": [
                    {
                        "ticket_type_id": created_ticket_types[1].id,
                        "quantity": 1,
                        "unit_price": created_ticket_types[1].price,
                        "qr_code": f"QR-{uuid.uuid4()}"
                    }
                ]
            }
        ]
        
        for order_data in orders:
            items = order_data.pop('items', [])
            order = Order(**order_data)
            db.session.add(order)
            db.session.flush()  # To get the order ID
            
            # Create order items
            for item_data in items:
                item = OrderItem(order_id=order.id, **item_data)
                db.session.add(item)
                
                # Update ticket type quantity_sold
                ticket_type = TicketType.query.get(item.ticket_type_id)
                if ticket_type:
                    ticket_type.quantity_sold += item.quantity
            
            # Create payment record for completed orders
            if order.status == 'completed':
                payment = Payment(
                    order_id=order.id,
                    amount=order.total_amount,
                    provider='mpesa',
                    status='success',
                    merchant_request_id=f'MP-{uuid.uuid4()}',
                    checkout_request_id=f'CR-{uuid.uuid4()}',
                    result_code='0',
                    result_desc='Success',
                    phone='+254712345678'  # Sample phone number
                )
                db.session.add(payment)
    
    db.session.commit()
    print("Database seeded successfully with sample data!")

def reset_database():
    """Reset the database and seed with fresh data"""
    app = create_app()
    
    with app.app_context():
        try:
            # Drop all tables
            drop_tables()
            
            # Recreate tables
            create_tables()
            
            # Seed with initial data
            seed_data()
            
            print("\n✅ Database has been reset and seeded successfully!")
            print("\nAdmin Credentials:")
            print("Email: admin@eventgrid.com")
            print("Password: Admin@123")
            print("\nUser Credentials:")
            print("Email: user@eventgrid.com")
            print("Password: User@123")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error resetting database: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    if reset_database():
        sys.exit(0)
    else:
        sys.exit(1)
