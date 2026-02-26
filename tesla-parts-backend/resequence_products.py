from sqlmodel import Session, select, col
from database import engine
from models import Product, Category, Subcategory

def resequence():
    with Session(engine) as session:
        print("Starting re-sequencing of products...")
        
        # We process products by subcategory to keep them organized
        subcategories = session.exec(select(Subcategory)).all()
        
        for sub in subcategories:
            # Get products in this subcategory, sorted by current sort_order DESC, then name
            products = session.exec(
                select(Product)
                .where(Product.subcategory_id == sub.id)
                .order_by(col(Product.sort_order).desc(), col(Product.name).asc())
            ).all()
            
            if not products:
                continue
                
            print(f"Resequencing subcategory: {sub.name} ({len(products)} products)")
            
            # Assign values with a gap of 10 to allow for future manual adjustments
            # High values at the top because we sort DESC
            current_val = len(products) * 10
            for p in products:
                p.sort_order = current_val
                session.add(p)
                current_val -= 10
        
        # Also handle products that might be directly in categories (if any)
        categories = session.exec(select(Category)).all()
        for cat in categories:
            # Find products that have this category name but NO subcategory
            products = session.exec(
                select(Product)
                .where(col(Product.category).contains(cat.name))
                .where(Product.subcategory_id == None)
                .order_by(col(Product.sort_order).desc(), col(Product.name).asc())
            ).all()
            
            if not products:
                continue
            
            print(f"Resequencing root category: {cat.name} ({len(products)} products)")
            current_val = len(products) * 10
            for p in products:
                p.sort_order = current_val
                session.add(p)
                current_val -= 10

        session.commit()
        print("Resequencing complete!")

if __name__ == "__main__":
    resequence()
