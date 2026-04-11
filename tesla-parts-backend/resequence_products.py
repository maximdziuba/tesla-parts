from sqlmodel import Session, select, col
from database import engine
from models import Product, Category, Subcategory

def resequence_children(session, parent_sub):
    # Sort children by current order
    children = session.exec(
        select(Subcategory)
        .where(Subcategory.parent_id == parent_sub.id)
        .order_by(col(Subcategory.sort_order).desc(), col(Subcategory.id).asc())
    ).all()
    
    # Assign unique, gapped values
    for i, child in enumerate(children):
        child.sort_order = 1000 - (i * 10)
        session.add(child)
        # Recursively resequence descendants
        resequence_children(session, child)

def resequence_all():
    with Session(engine) as session:
        # 1. Resequence Categories
        print("Resequencing Categories...")
        categories = session.exec(
            select(Category).order_by(col(Category.sort_order).desc(), col(Category.id).asc())
        ).all()
        
        for i, cat in enumerate(categories):
            cat.sort_order = 1000 - (i * 10)
            session.add(cat)
        session.commit()

        # 2. Resequence Subcategories
        print("Resequencing Subcategories...")
        cats = session.exec(select(Category)).all()
        for cat in cats:
            # Root subcategories for this category
            subs = session.exec(
                select(Subcategory)
                .where(Subcategory.category_id == cat.id)
                .where(Subcategory.parent_id == None)
                .order_by(col(Subcategory.sort_order).desc(), col(Subcategory.id).asc())
            ).all()
            for i, sub in enumerate(subs):
                sub.sort_order = 1000 - (i * 10)
                session.add(sub)
                resequence_children(session, sub)
        session.commit()

        # 3. Resequence Products (within their groups)
        print("Resequencing Products...")
        
        # Subcategory level products
        subcategories = session.exec(select(Subcategory)).all()
        for sub in subcategories:
            products = session.exec(
                select(Product)
                .where(Product.subcategory_id == sub.id)
                .order_by(col(Product.sort_order).desc(), col(Product.name).asc())
            ).all()
            for i, p in enumerate(products):
                p.sort_order = 1000 - (i * 10)
                session.add(p)
        
        # Root category level products
        for cat in cats:
            products = session.exec(
                select(Product)
                .where(col(Product.category).contains(cat.name))
                .where(Product.subcategory_id == None)
                .order_by(col(Product.sort_order).desc(), col(Product.name).asc())
            ).all()
            for i, p in enumerate(products):
                p.sort_order = 1000 - (i * 10)
                session.add(p)

        session.commit()
        print("Done!")

if __name__ == "__main__":
    resequence_all()
