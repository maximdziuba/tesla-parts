from sqlmodel import SQLModel
from database import engine
from models import ProductImage

def migrate():
    print("Creating 'productimage' table...")
    SQLModel.metadata.create_all(engine)
    print("Table created successfully.")

if __name__ == "__main__":
    migrate()
