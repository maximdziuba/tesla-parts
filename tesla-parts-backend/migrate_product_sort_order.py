from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        try:
            # Check if column exists
            session.exec(text("SELECT sort_order FROM product LIMIT 1"))
            print("Column 'sort_order' already exists in 'product' table.")
        except Exception:
            print("Adding 'sort_order' column to 'product' table...")
            session.exec(text("ALTER TABLE product ADD COLUMN sort_order INTEGER DEFAULT 0"))
            session.commit()
            print("Column added successfully.")

if __name__ == "__main__":
    migrate()
