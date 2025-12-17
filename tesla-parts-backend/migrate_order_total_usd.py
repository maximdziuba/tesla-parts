import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

# Determine database URL from environment variable, default to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tesla_parts.db")

def migrate_order_total_usd(engine: Engine):
    """
    Adds the 'totalUSD' column and removes the 'totalUAH' column from the 'order' table.
    """
    # Create an inspector to check existing columns
    inspector = inspect(engine)
    columns = inspector.get_columns('order')
    column_names = {col['name'] for col in columns}

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # 1. Add totalUSD column if it doesn't exist
            if 'totalUSD' not in column_names:
                print("Column 'totalUSD' not found. Adding it to the 'order' table.")
                # FIX: Added quotes around "totalUSD" to preserve case sensitivity
                connection.execute(text('ALTER TABLE "order" ADD COLUMN "totalUSD" REAL'))
                print("Column 'totalUSD' added successfully.")
            else:
                print("Column 'totalUSD' already exists.")

            # 2. Remove totalUAH column if it exists
            if 'totalUAH' in column_names:
                print("Column 'totalUAH' found. Removing it from the 'order' table.")
                
                if engine.dialect.name == 'postgresql':
                    # FIX: Added quotes around "totalUAH" to preserve case sensitivity
                    connection.execute(text('ALTER TABLE "order" DROP COLUMN "totalUAH"'))
                    print("Column 'totalUAH' removed successfully.")
                else:
                    # FIX: Corrected comment syntax (removed //)
                    # Note: Dropping columns in SQLite requires a more complex procedure
                    # involving recreating the table. This script will only work for
                    # PostgreSQL or other backends that support DROP COLUMN directly.
                    print("WARNING: SQLite does not support DROP COLUMN easily. "
                          "The 'totalUAH' column was not removed. "
                          "Please manually recreate the table if you want to remove it.")
            else:
                print("Column 'totalUAH' does not exist, no action needed.")
            
            transaction.commit()
            print("Migration completed successfully.")

        except Exception as e:
            print(f"An error occurred during migration: {e}")
            transaction.rollback()
            print("Migration failed and was rolled back.")

if __name__ == "__main__":
    if not DATABASE_URL:
        raise Exception("DATABASE_URL environment variable is not set.")
    
    print(f"Connecting to database: {DATABASE_URL}")
    db_engine = create_engine(DATABASE_URL)
    migrate_order_total_usd(db_engine)