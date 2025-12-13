from sqlmodel import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Adding 'code' column to 'subcategory' table...")
        try:
            conn.execute(text("ALTER TABLE subcategory ADD COLUMN code VARCHAR"))
            print("Column 'code' added.")
        except Exception as e:
            print(f"Error adding 'code': {e}")

        print("Adding 'detail_number' column to 'product' table...")
        try:
            conn.execute(text("ALTER TABLE product ADD COLUMN detail_number VARCHAR"))
            print("Column 'detail_number' added.")
        except Exception as e:
            print(f"Error adding 'detail_number': {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
