from sqlmodel import SQLModel, create_engine
import os
import models

# Database setup
DATABASE_URL = "sqlite:///./tesla_parts.db"
engine = create_engine(DATABASE_URL)

def migrate():
    print("Creating new tables for Email Campaigns...")
    try:
        SQLModel.metadata.create_all(engine)
        print("Successfully created EmailList and CustomerEmailListLink tables.")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
