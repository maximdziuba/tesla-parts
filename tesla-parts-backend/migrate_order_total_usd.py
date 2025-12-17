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
                connection.execute(text('ALTER TABLE "order" ADD COLUMN "totalUSD" REAL'))
                print("Column 'totalUSD' added successfully.")
                column_names.add('totalUSD')
            else:
                print("Column 'totalUSD' already exists.")

            # Fetch current exchange rate from settings (fallback to 40)
            exchange_rate = 40.0
            try:
                result = connection.execute(text("SELECT value FROM settings WHERE key = 'exchange_rate'")).fetchone()
                if result and result[0]:
                    exchange_rate = float(result[0])
                    if exchange_rate <= 0:
                        exchange_rate = 40.0
            except Exception as rate_error:
                print(f"Warning: could not fetch exchange rate, using default 40.0. Details: {rate_error}")

            # 2. Remove totalUAH column if it exists
            if 'totalUAH' in column_names:
                print("Column 'totalUAH' found. Migrating values to 'totalUSD'.")
                if 'totalUSD' in column_names:
                    connection.execute(
                        text(
                            'UPDATE "order" SET "totalUSD" = COALESCE("totalUSD", 0) '
                            'WHERE "totalUSD" IS NOT NULL'
                        )
                    )
                    connection.execute(
                        text(
                            'UPDATE "order" '
                            'SET "totalUSD" = CASE '
                            'WHEN "totalUSD" IS NULL OR "totalUSD" = 0 THEN '
                            'COALESCE("totalUAH", 0) / :rate '
                            'ELSE "totalUSD" END '
                            'WHERE "totalUAH" IS NOT NULL'
                        ),
                        {"rate": exchange_rate if exchange_rate else 40.0},
                    )

                if engine.dialect.name == 'postgresql':
                    connection.execute(text('ALTER TABLE "order" DROP COLUMN "totalUAH"'))
                    print('Column "totalUAH" removed successfully.')
                else:
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
