from sqlmodel import Session, text
from database import engine

def migrate():
    with Session(engine) as session:
        try:
            # Check if column exists
            session.exec(text("SELECT image FROM subcategory LIMIT 1"))
            print("Column 'image' already exists in 'subcategory'.")
        except Exception:
            print("Adding 'image' column to 'subcategory' table...")
            session.exec(text("ALTER TABLE subcategory ADD COLUMN image VARCHAR"))
            session.commit()
            print("Column added successfully.")

if __name__ == "__main__":
    migrate()
