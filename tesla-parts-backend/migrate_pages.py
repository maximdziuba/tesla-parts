"""
Migration script to add Page table
Run this script to create the page table in the database.
"""
import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tesla_parts.db")

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if page table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='page'")
    if cursor.fetchone():
        print("Page table already exists. Skipping migration.")
        conn.close()
        return
    
    # Create page table
    cursor.execute("""
        CREATE TABLE page (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_published BOOLEAN DEFAULT 1,
            location TEXT DEFAULT 'footer'
        )
    """)
    
    # Create index on slug
    cursor.execute("CREATE INDEX idx_page_slug ON page(slug)")
    
    # Insert some default pages
    default_pages = [
        ("about", "Про нас", "Ласкаво просимо до нашого магазину запчастин Tesla!", True, "footer"),
        ("delivery", "Доставка", "Інформація про доставку та оплату.", True, "footer"),
        ("contacts", "Контакти", "Наші контактні дані.", True, "footer"),
        ("warranty", "Гарантія", "Умови гарантійного обслуговування.", True, "footer"),
        ("privacy-policy", "Політика конфіденційності", "Політика конфіденційності інтернет-магазину Tesla Parts Center.", True, "footer"),
        ("terms-of-service", "Умови сервісу", "Умови сервісу інтернет-магазину Tesla Parts Center.", True, "footer"),
    ]
    
    cursor.executemany(
        "INSERT INTO page (slug, title, content, is_published, location) VALUES (?, ?, ?, ?, ?)",
        default_pages
    )
    
    conn.commit()
    conn.close()
    print("Page table created successfully with default pages!")

if __name__ == "__main__":
    migrate()
