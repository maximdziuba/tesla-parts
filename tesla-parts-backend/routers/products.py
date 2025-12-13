from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
import shutil
import os
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
def create_product(
    id: Optional[str] = Form(None),
    name: str = Form(...),
    category: str = Form(...),
    priceUAH: float = Form(...),
    description: str = Form(...),
    inStock: bool = Form(...),
    image: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    image_url = image
    if file:
        file_location = f"static/images/{file.filename}"
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
        # Assuming localhost for now, in prod this should be configured
        image_url = f"http://127.0.0.1:8000/{file_location}"
    
    if not image_url:
        image_url = "https://via.placeholder.com/300"

    product_data = Product(
        id=id or f"prod-{os.urandom(4).hex()}",
        name=name,
        category=category,
        priceUAH=priceUAH,
        description=description,
        inStock=inStock,
        image=image_url
    )
    
    session.add(product_data)
    session.commit()
    session.refresh(product_data)
    return product_data

@router.delete("/{product_id}", dependencies=[Depends(verify_admin)])
def delete_product(product_id: str, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.delete(product)
    session.commit()
    return {"ok": True}
