import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

# Determine database URL from environment variable, default to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tesla_parts.db")

def migrate_order_customer_id(engine: Engine):
    """
    Adds the 'customer_id' column to the 'order' table if it doesn't exist.
    """
    inspector = inspect(engine)
    columns = inspector.get_columns('order')
    column_names = {col['name'] for col in columns}

    if 'customer_id' in column_names:
        print("Column 'customer_id' already exists in 'order' table.")
        return

    print("Adding 'customer_id' column to 'order' table...")
    with engine.connect() as connection:
        try:
            # Use double quotes for table name "order"
            connection.execute(text('ALTER TABLE "order" ADD COLUMN "customer_id" INTEGER REFERENCES "customer"("id")'))
            connection.commit()
            print("Successfully added 'customer_id' column.")
        except Exception as e:
            print(f"An error occurred during migration: {e}")

if __name__ == "__main__":
    print(f"Connecting to database: {DATABASE_URL}")
    db_engine = create_engine(DATABASE_URL)
    migrate_order_customer_id(db_engine)
