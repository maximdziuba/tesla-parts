from sqlmodel import SQLModel, create_engine, Session, select
from models import Review
import os
from database import engine

def migrate_reviews():
    print("Creating reviews table...")
    SQLModel.metadata.create_all(engine, tables=[Review.__table__])
    print("Reviews table created successfully.")

if __name__ == "__main__":
    migrate_reviews()
