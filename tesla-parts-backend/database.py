from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
import os

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
    if is_sqlite():
        _ensure_category_sort_order_column()
        _ensure_product_cross_number_column()

def get_session():
    with Session(engine) as session:
        yield session

def _ensure_category_sort_order_column():
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info('category')")).fetchall()
        columns = {row[1] for row in result}
        if "sort_order" not in columns:
            conn.execute(text("ALTER TABLE category ADD COLUMN sort_order INTEGER DEFAULT 0"))
            conn.commit()

def _ensure_product_cross_number_column():
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info('product')")).fetchall()
        columns = {row[1] for row in result}
        if "cross_number" not in columns:
            conn.execute(text("ALTER TABLE product ADD COLUMN cross_number VARCHAR DEFAULT ''"))
            conn.commit()
