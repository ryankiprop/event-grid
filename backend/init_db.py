import os
import sys
from app import create_app, db
from app.models import User, Event, TicketType, Order, OrderItem, Payment

def init_db():
    app = create_app()
    
    with app.app_context():
        try:
            print("Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            print("✅ Database tables created successfully!")
            
            # List all tables
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"\nDatabase contains {len(tables)} tables:")
            for table in tables:
                print(f"- {table}")
                
            return True
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    if init_db():
        sys.exit(0)
    else:
        sys.exit(1)
