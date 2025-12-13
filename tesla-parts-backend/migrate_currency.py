from sqlmodel import SQLModel, create_engine, Session, text
from models import Product, Settings
import os

# Database setup
DATABASE_URL = "sqlite:///./tesla_parts.db"
engine = create_engine(DATABASE_URL)

def migrate():
    with Session(engine) as session:
        # 1. Add priceUSD column to product table
        try:
            session.exec(text("ALTER TABLE product ADD COLUMN priceUSD FLOAT DEFAULT 0.0"))
            print("Added priceUSD column to product table.")
        except Exception as e:
            print(f"Column priceUSD might already exist: {e}")

        # 2. Create Settings table
        try:
            # Check if table exists
            session.exec(text("SELECT 1 FROM settings LIMIT 1"))
            print("Settings table already exists.")
        except Exception:
            # Create table
            print("Creating Settings table...")
            SQLModel.metadata.create_all(engine)
            
            # Initialize default exchange rate
            session.add(Settings(key="exchange_rate", value="40.0"))
            session.commit()
            print("Settings table created and initialized.")

if __name__ == "__main__":
    migrate()
