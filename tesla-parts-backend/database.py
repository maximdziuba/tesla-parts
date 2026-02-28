from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy import text, inspect
import os
from models import Settings, User # Import Settings and User model
from auth import get_password_hash # Import password hashing utility

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
else:
    sqlite_file_name = "tesla_parts.db"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(base_dir, sqlite_file_name)
    sqlite_url = f"sqlite:///{sqlite_path}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(sqlite_url, connect_args=connect_args)


def is_sqlite():
    return engine.url.drivername == "sqlite"

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
    # Run manual migrations for existing tables
    _ensure_category_sort_order_column()
    _ensure_subcategory_sort_order_column()
    _ensure_product_cross_number_column()
    _ensure_category_seo_columns()
    _ensure_product_sort_order_column()
    _ensure_product_subcategory_id_column()
    
    with Session(engine) as session:
        # Check if admin user exists, if not, create it
        admin_user = session.exec(select(User).where(User.username == "admin")).first()
        if not admin_user:
            hashed_password = get_password_hash("admin123") # Default password
            initial_admin_user = User(username="admin", hashed_password=hashed_password)
            session.add(initial_admin_user)
            session.commit()

def get_session():
    with Session(engine) as session:
        yield session

def _ensure_category_sort_order_column():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("category")]
    if "sort_order" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE category ADD COLUMN sort_order INTEGER DEFAULT 0"))
            conn.commit()

def _ensure_product_cross_number_column():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("product")]
    if "cross_number" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE product ADD COLUMN cross_number VARCHAR"))
            conn.commit()

def _ensure_category_seo_columns():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("category")]
    with engine.connect() as conn:
        if "meta_title" not in columns:
            conn.execute(text("ALTER TABLE category ADD COLUMN meta_title VARCHAR"))
        if "meta_description" not in columns:
            conn.execute(text("ALTER TABLE category ADD COLUMN meta_description VARCHAR"))
        conn.commit()

def _ensure_subcategory_sort_order_column():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("subcategory")]
    if "sort_order" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE subcategory ADD COLUMN sort_order INTEGER DEFAULT 0"))
            conn.commit()

def _ensure_product_sort_order_column():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("product")]
    if "sort_order" not in columns:
        print("Adding 'sort_order' column to 'product' table...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE product ADD COLUMN sort_order INTEGER DEFAULT 0"))
            conn.commit()

def _ensure_product_subcategory_id_column():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("product")]
    if "subcategory_id" not in columns:
        print("Adding 'subcategory_id' column to 'product' table...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE product ADD COLUMN subcategory_id INTEGER"))
            conn.commit()
