from sqlmodel import Session, select
from database import engine
from models import Category, Subcategory

def seed_data():
    with Session(engine) as session:
        # Check if categories exist
        if session.exec(select(Category)).first():
            print("Categories already exist. Skipping seed.")
            return

        # Model 3
        cat_m3 = Category(name="Model 3", image="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Main-Hero-Desktop-LHD.jpg")
        session.add(cat_m3)
        session.commit()
        session.refresh(cat_m3)

        subcats_m3 = ["Body", "Interior", "Electronics", "Wheels", "Suspension"]
        for name in subcats_m3:
            session.add(Subcategory(name=name, category_id=cat_m3.id))

        # Model S
        cat_ms = Category(name="Model S", image="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Main-Hero-Desktop-LHD.jpg")
        session.add(cat_ms)
        session.commit()
        session.refresh(cat_ms)

        subcats_ms = ["Body", "Interior", "Electronics", "Wheels", "Suspension"]
        for name in subcats_ms:
            session.add(Subcategory(name=name, category_id=cat_ms.id))

        # Model X
        cat_mx = Category(name="Model X", image="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Main-Hero-Desktop-LHD.jpg")
        session.add(cat_mx)
        session.commit()
        session.refresh(cat_mx)

        subcats_mx = ["Body", "Interior", "Electronics", "Wheels", "Suspension"]
        for name in subcats_mx:
            session.add(Subcategory(name=name, category_id=cat_mx.id))
        
        session.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    # Ensure tables are created (usually done by main.py on startup, but we can force it here if needed)
    # For now assuming tables are created when main.py runs or we can import create_db_and_tables
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    
    seed_data()
