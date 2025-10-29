"""Database seeding script"""
import sys
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Event, Order, Payment, TicketType, User

def seed_data():
    app = create_app()
    
    with app.app_context():
        # Check for existing admin user
        admin_exists = db.session.query(User).filter_by(email="admin@eventgrid.com").first()
        if not admin_exists:
            users = [
                User(
                    email="admin@eventgrid.com",
                    password_hash=generate_password_hash("Admin@123"),
                    first_name="Admin",
                    last_name="User",
                    role="admin"
                ),
                User(
                    email="user1@eventgrid.com",
                    password_hash=generate_password_hash("User1@123"),
                    first_name="John",
                    last_name="Doe"
                )
            ]
            db.session.add_all(users)
            db.session.commit()

        # Check for existing events
        tech_conf_exists = db.session.query(Event).filter_by(title="Tech Conference 2023").first()
        music_fest_exists = db.session.query(Event).filter_by(title="Music Festival").first()
        
        # Get admin user's actual UUID
        admin = db.session.query(User).filter_by(email="admin@eventgrid.com").first()
        
        if not tech_conf_exists and admin:
            events = [
                Event(
                    title="Tech Conference 2023",
                    description="Annual technology conference",
                    start_date=datetime.now() + timedelta(days=30),
                    end_date=datetime.now() + timedelta(days=31),
                    venue_name="Nairobi Convention Center",
                    organizer_id=admin.id  # Use actual UUID
                )
            ]
            db.session.add_all(events)
            db.session.commit()
        
        if not music_fest_exists and admin:
            events = [
                Event(
                    title="Music Festival",
                    description="Summer music festival",
                    start_date=datetime.now() + timedelta(days=60),
                    end_date=datetime.now() + timedelta(days=62),
                    venue_name="Mombasa Waterfront",
                    organizer_id=admin.id  # Use actual UUID
                )
            ]
            db.session.add_all(events)
            db.session.commit()

        # Create tickets
        events = db.session.query(Event).all()
        for event in events:
            vip_ticket_exists = db.session.query(TicketType).filter_by(name="VIP", event_id=event.id).first()
            regular_ticket_exists = db.session.query(TicketType).filter_by(name="Regular", event_id=event.id).first()
            
            if not vip_ticket_exists:
                ticket_types = [
                    TicketType(
                        name="VIP",
                        price=10000,
                        quantity_total=50,
                        quantity_sold=0,
                        event_id=event.id
                    )
                ]
                db.session.add_all(ticket_types)
                db.session.commit()
            
            if not regular_ticket_exists:
                ticket_types = [
                    TicketType(
                        name="Regular",
                        price=5000,
                        quantity_total=100,
                        quantity_sold=0,
                        event_id=event.id
                    )
                ]
                db.session.add_all(ticket_types)
                db.session.commit()

        print("✅ Database seeded successfully!")
        return True

if __name__ == "__main__":
    if seed_data():
        sys.exit(0)
    else:
        sys.exit(1)
