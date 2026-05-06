import sqlite3

def run():
    print("Migrating order table to add note column...")
    try:
        conn = sqlite3.connect('tesla_parts.db')
        cursor = conn.cursor()
        
        # Add note column if it doesn't exist
        cursor.execute("ALTER TABLE `order` ADD COLUMN note VARCHAR;")
        conn.commit()
        print("Successfully added note column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Note column already exists.")
        else:
            print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run()
