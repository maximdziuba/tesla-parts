import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tesla_parts.db")

DEFAULT_STATIC_SEO = {
    "home": {
        "meta_title": "Tesla Parts Center | Магазин запчастин для Tesla",
        "meta_description": "Купуйте оригінальні та перевірені запчастини для Tesla з доставкою по Україні.",
    },
    "about": {
        "meta_title": "Про Tesla Parts Center",
        "meta_description": "Дізнайтеся більше про команду Tesla Parts Center та наш підхід до сервісу.",
    },
    "delivery": {
        "meta_title": "Доставка та оплата | Tesla Parts Center",
        "meta_description": "Дізнайтеся про варіанти доставки та оплати в Tesla Parts Center.",
    },
    "returns": {
        "meta_title": "Повернення та гарантія | Tesla Parts Center",
        "meta_description": "Умови повернення товарів та гарантії інтернет-магазину Tesla Parts Center.",
    },
    "faq": {
        "meta_title": "Часті питання | Tesla Parts Center",
        "meta_description": "Відповіді на найпоширеніші запитання клієнтів Tesla Parts Center.",
    },
    "contacts": {
        "meta_title": "Контакти Tesla Parts Center",
        "meta_description": "Зв’яжіться з нами для консультації або замовлення запчастин.",
    },
}


def _ensure_sort_order_column(engine: Engine, table_name: str):
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    column_names = {col["name"] for col in columns}
    if "sort_order" in column_names:
        print(f'{table_name} table already has "sort_order" column.')
        return

    stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "sort_order" INTEGER DEFAULT 0'
    with engine.begin() as conn:
        print(f"Executing: {stmt}")
        conn.execute(text(stmt))
    print(f'{table_name} sort_order column ensured.')


def ensure_category_seo_columns(engine: Engine):
    inspector = inspect(engine)
    columns = inspector.get_columns("category")
    column_names = {col["name"] for col in columns}

    statements = []
    if "meta_title" not in column_names:
        statements.append('ALTER TABLE "category" ADD COLUMN "meta_title" VARCHAR')
    if "meta_description" not in column_names:
        statements.append('ALTER TABLE "category" ADD COLUMN "meta_description" VARCHAR')

    if not statements:
        print("Category table already has SEO columns.")
        return

    with engine.begin() as conn:
        for stmt in statements:
            print(f"Executing: {stmt}")
            conn.execute(text(stmt))
    print("Category SEO columns ensured.")


def ensure_static_seo_table(engine: Engine):
    inspector = inspect(engine)
    if "staticpageseo" in inspector.get_table_names():
        print("Table 'staticpageseo' already exists.")
        return

    dialect = engine.dialect.name
    if dialect == "postgresql":
        create_sql = """
        CREATE TABLE staticpageseo (
            id SERIAL PRIMARY KEY,
            slug VARCHAR(255) UNIQUE NOT NULL,
            meta_title VARCHAR(512),
            meta_description TEXT
        )
        """
    else:
        create_sql = """
        CREATE TABLE IF NOT EXISTS staticpageseo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug VARCHAR(255) UNIQUE NOT NULL,
            meta_title VARCHAR(512),
            meta_description TEXT
        )
        """

    with engine.begin() as conn:
        print("Creating table 'staticpageseo'.")
        conn.execute(text(create_sql))
    print("Table 'staticpageseo' created.")


def seed_static_seo(engine: Engine):
    with engine.begin() as conn:
        for slug, payload in DEFAULT_STATIC_SEO.items():
            exists = conn.execute(
                text("SELECT id FROM staticpageseo WHERE slug = :slug"),
                {"slug": slug},
            ).fetchone()
            if exists:
                continue
            print(f"Seeding SEO record for '{slug}'.")
            conn.execute(
                text(
                    """
                    INSERT INTO staticpageseo (slug, meta_title, meta_description)
                    VALUES (:slug, :title, :description)
                    """
                ),
                {
                    "slug": slug,
                    "title": payload.get("meta_title"),
                    "description": payload.get("meta_description"),
                },
            )
    print("Static SEO defaults ensured.")


def run_migration():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is required.")

    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)

    _ensure_sort_order_column(engine, "category")
    _ensure_sort_order_column(engine, "subcategory")
    ensure_category_seo_columns(engine)
    ensure_static_seo_table(engine)
    seed_static_seo(engine)

    print("Migration completed successfully.")


if __name__ == "__main__":
    run_migration()
