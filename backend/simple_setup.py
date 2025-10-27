import os
import sys
from app import create_app, db
from app.models.user import User
from app.models.event import Event
from app.models.ticket import TicketType
from app.models.order import Order, OrderItem

def setup_database():
    app = create_app()
    
    with app.app_context():
        try:
            print("Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            # Verify tables were created
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print("\n[SUCCESS] Database setup complete!")
            print(f"\nCreated {len(tables)} tables:")
            for table in tables:
                columns = [col['name'] for col in inspector.get_columns(table)]
                print(f"- {table}: {', '.join(columns)}")
            
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Database setup failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    if setup_database():
        sys.exit(0)
    else:
        sys.exit(1)
