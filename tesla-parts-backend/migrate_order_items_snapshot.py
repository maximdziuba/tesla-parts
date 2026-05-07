import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

# Determine database URL from environment variable, default to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tesla_parts.db")

def migrate_order_items_snapshot(engine: Engine):
    """
    Adds snapshot columns to 'orderitem' table to preserve product info after deletion.
    Updates foreign key to SET NULL.
    """
    inspector = inspect(engine)
    columns = inspector.get_columns('orderitem')
    column_names = {col['name'] for col in columns}

    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # 1. Add snapshot columns if they don't exist
            new_columns = {
                'product_name': 'TEXT DEFAULT \'Unknown Product\'',
                'product_image': 'TEXT',
                'product_detail_number': 'TEXT'
            }
            
            for col_name, col_type in new_columns.items():
                if col_name not in column_names:
                    print(f"Adding column '{col_name}' to 'orderitem' table.")
                    connection.execute(text(f'ALTER TABLE "orderitem" ADD COLUMN "{col_name}" {col_type}'))
            
            # 2. Populate snapshot columns from current 'product' table
            print("Populating snapshot columns from 'product' table.")
            if engine.dialect.name == 'postgresql':
                connection.execute(text('''
                    UPDATE "orderitem"
                    SET 
                        "product_name" = p.name,
                        "product_image" = p.image,
                        "product_detail_number" = p.detail_number
                    FROM "product" p
                    WHERE "orderitem".product_id = p.id
                '''))
            else:
                # SQLite syntax
                connection.execute(text('''
                    UPDATE "orderitem"
                    SET 
                        "product_name" = (SELECT name FROM product WHERE product.id = orderitem.product_id),
                        "product_image" = (SELECT image FROM product WHERE product.id = orderitem.product_id),
                        "product_detail_number" = (SELECT detail_number FROM product WHERE product.id = orderitem.product_id)
                    WHERE EXISTS (SELECT 1 FROM product WHERE product.id = orderitem.product_id)
                '''))

            # 3. Update foreign key to ON DELETE SET NULL (PostgreSQL only)
            if engine.dialect.name == 'postgresql':
                print("Updating foreign key constraint to ON DELETE SET NULL.")
                # We need to find the constraint name. It's usually orderitem_product_id_fkey
                # but we can try to find it dynamically.
                constraint_query = text('''
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = '"orderitem"'::regclass 
                    AND confrelid = '"product"'::regclass
                ''')
                result = connection.execute(constraint_query).fetchone()
                
                if result:
                    conname = result[0]
                    print(f"Dropping existing constraint: {conname}")
                    connection.execute(text(f'ALTER TABLE "orderitem" DROP CONSTRAINT "{conname}"'))
                    print("Adding new constraint with ON DELETE SET NULL.")
                    connection.execute(text(f'''
                        ALTER TABLE "orderitem" 
                        ADD CONSTRAINT "{conname}" 
                        FOREIGN KEY (product_id) 
                        REFERENCES product(id) 
                        ON DELETE SET NULL
                    '''))
                else:
                    # Try common name if not found
                    try:
                        connection.execute(text('ALTER TABLE "orderitem" DROP CONSTRAINT "orderitem_product_id_fkey"'))
                        connection.execute(text('''
                            ALTER TABLE "orderitem" 
                            ADD CONSTRAINT "orderitem_product_id_fkey" 
                            FOREIGN KEY (product_id) 
                            REFERENCES product(id) 
                            ON DELETE SET NULL
                        '''))
                    except Exception as e:
                        print(f"Warning: Could not update constraint manually: {e}")

                # Also ensure product_id is nullable
                connection.execute(text('ALTER TABLE "orderitem" ALTER COLUMN "product_id" DROP NOT NULL'))
            
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
    migrate_order_items_snapshot(db_engine)
