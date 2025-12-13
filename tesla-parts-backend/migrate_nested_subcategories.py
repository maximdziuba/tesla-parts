from sqlmodel import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Adding 'parent_id' column to 'subcategory' table...")
        try:
            conn.execute(text("ALTER TABLE subcategory ADD COLUMN parent_id INTEGER REFERENCES subcategory(id)"))
            print("Column 'parent_id' added.")
        except Exception as e:
            print(f"Error adding 'parent_id': {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
