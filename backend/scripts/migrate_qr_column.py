#!/usr/bin/env python3
import sys
import os
from sqlalchemy import create_engine, text

# Usage: adjust database URL or use your .env/config
DB_URL = os.getenv('DATABASE_URL') or 'sqlite:///../instance/app.db'
engine = create_engine(DB_URL)

with engine.connect() as conn:
    dialect = conn.engine.dialect.name
    print(f"DB dialect: {dialect}")
    print("About to ALTER order_items.qr_code from VARCHAR to TEXT. BACKUP your DB first!")
    try:
        if dialect == 'postgresql':
            conn.execute(text("ALTER TABLE order_items ALTER COLUMN qr_code TYPE TEXT;"))
        elif dialect == 'mysql':
            conn.execute(text("ALTER TABLE order_items MODIFY qr_code TEXT;"))
        elif dialect == 'sqlite':
            # SQLite supports writing into TEXT columns
            # But prior to v3.35, ALTER COLUMN is not available; you might need to recreate table!
            print("For SQLite: If you've just changed the model, future rows will be fine. Existing rows will work, but column type is advisory. No direct ALTER for SQLite if existing table; consider migrating w/ a tool like Alembic or start fresh for dev.")
        else:
            print("Unknown/unsupported DB schema migration. Do manually if needed.")
        print("Migration likely succeeded. Please verify your DB schema!")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
