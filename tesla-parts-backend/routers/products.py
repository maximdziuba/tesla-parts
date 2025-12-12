from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Product
from schemas import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])

def verify_admin(x_admin_secret: str = Header(None)):
    import os
    expected = os.getenv("ADMIN_SECRET", "secret")
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/", response_model=List[ProductRead])
def read_products(category: str = None, session: Session = Depends(get_session)):
    query = select(Product)
    if category:
        query = query.where(Product.category == category)
    return session.exec(query).all()

@router.get("/labels", tags=["labels"])
def read_labels(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    categories = list(set(p.category for p in products))
    return categories

@router.post("/", response_model=ProductRead, dependencies=[Depends(verify_admin)])
def create_product(product: ProductCreate, session: Session = Depends(get_session)):
    db_product = Product.model_validate(product)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product

@router.delete("/{product_id}", dependencies=[Depends(verify_admin)])
def delete_product(product_id: str, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.delete(product)
    session.commit()
    return {"ok": True}
