from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        # Migrate subcategory_id
        try:
            session.exec(text("SELECT subcategory_id FROM product LIMIT 1"))
            print("Column 'subcategory_id' already exists.")
        except Exception:
            print("Adding 'subcategory_id' column to 'product' table...")
            session.exec(text("ALTER TABLE product ADD COLUMN subcategory_id INTEGER"))
            session.commit()
            print("Column 'subcategory_id' added successfully.")

        # Migrate sort_order
        try:
            session.exec(text("SELECT sort_order FROM product LIMIT 1"))
            print("Column 'sort_order' already exists.")
        except Exception:
            print("Adding 'sort_order' column to 'product' table...")
            session.exec(text("ALTER TABLE product ADD COLUMN sort_order INTEGER DEFAULT 0"))
            session.commit()
            print("Column 'sort_order' added successfully.")

if __name__ == "__main__":
    migrate()
