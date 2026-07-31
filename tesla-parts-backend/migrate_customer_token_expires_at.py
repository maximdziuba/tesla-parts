import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

# Determine database URL from environment variable, default to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tesla_parts.db")

def migrate_token_expires_at(engine: Engine):
    """
    Adds the 'token_expires_at' column to the 'customer' table if it doesn't exist.
    """
    inspector = inspect(engine)
    columns = inspector.get_columns('customer')
    column_names = {col['name'] for col in columns}

    if 'token_expires_at' in column_names:
        print("Column 'token_expires_at' already exists in 'customer' table.")
        return

    print("Adding 'token_expires_at' column to 'customer' table...")
    with engine.connect() as connection:
        try:
            connection.execute(text('ALTER TABLE "customer" ADD COLUMN "token_expires_at" DATETIME'))
            connection.commit()
            print("Successfully added 'token_expires_at' column.")
        except Exception as e:
            print(f"An error occurred during migration: {e}")

if __name__ == "__main__":
    print(f"Connecting to database: {DATABASE_URL}")
    db_engine = create_engine(DATABASE_URL)
    migrate_token_expires_at(db_engine)
