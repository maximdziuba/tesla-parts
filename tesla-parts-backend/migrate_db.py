from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        try:
            # Check if column exists to avoid error
            session.exec(text("SELECT subcategory_id FROM product LIMIT 1"))
            print("Column 'subcategory_id' already exists.")
        except Exception:
            print("Adding 'subcategory_id' column to 'product' table...")
            # Add the column. SQLite doesn't support adding foreign key constraints easily in ALTER TABLE,
            # but we can add the column. SQLModel/SQLAlchemy will handle the constraint logic at app level mostly,
            # though DB level constraint won't be strictly enforced unless we recreate table.
            # For dev purposes, adding the column is enough.
            session.exec(text("ALTER TABLE product ADD COLUMN subcategory_id INTEGER"))
            session.commit()
            print("Column added successfully.")

if __name__ == "__main__":
    migrate()
