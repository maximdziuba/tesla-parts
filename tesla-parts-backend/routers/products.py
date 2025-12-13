from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
import shutil
import os
from sqlalchemy.orm import selectinload
from database import get_session
from models import Product, ProductImage
from schemas import ProductCreate, ProductRead
from services.image_uploader import image_uploader

router = APIRouter(prefix="/products", tags=["products"])

def verify_admin(x_admin_secret: str = Header(None)):
    import os
    expected = os.getenv("ADMIN_SECRET", "secret")
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/", response_model=List[ProductRead])
def read_products(category: str = None, subcategory_id: int = None, session: Session = Depends(get_session)):
    query = select(Product).options(selectinload(Product.images))
    if category:
        query = query.where(Product.category == category)
    if subcategory_id:
        query = query.where(Product.subcategory_id == subcategory_id)
    
    products = session.exec(query).all()
    
    # Convert to Pydantic models with images list
    result = []
    for p in products:
        p_data = p.model_dump()
        p_data["images"] = [img.url for img in p.images]
        result.append(ProductRead(**p_data))
        
    return result

@router.get("/{product_id}", response_model=ProductRead)
def read_product(product_id: str, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    p_data = product.model_dump()
    p_data["images"] = [img.url for img in product.images]
    return ProductRead(**p_data)

@router.get("/labels", tags=["labels"])
def read_labels(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    categories = list(set(p.category for p in products))
    return categories

@router.post("/", response_model=ProductRead, dependencies=[Depends(verify_admin)])
async def create_product(
    id: Optional[str] = Form(None),
    name: str = Form(...),
    category: str = Form(...),
    subcategory_id: Optional[int] = Form(None),
    priceUAH: float = Form(...),
    priceUSD: float = Form(...),
    description: str = Form(...),
    inStock: bool = Form(...),
    detail_number: Optional[str] = Form(None),
    image: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    product_id = id or f"prod-{os.urandom(4).hex()}"
    image_urls = []
    
    # Handle multiple file uploads using the image uploader service
    if files:
        for file in files:
            if file.filename:
                url = await image_uploader.upload_image(file, folder="tesla-parts/products")
                if url:
                    image_urls.append(url)
    
    # Determine main image
    main_image = image
    if not main_image and image_urls:
        main_image = image_urls[0]
    if not main_image:
        main_image = "https://via.placeholder.com/300"

    product_data = Product(
        id=product_id,
        name=name,
        category=category,
        subcategory_id=subcategory_id,
        priceUAH=priceUAH,
        priceUSD=priceUSD,
        description=description,
        inStock=inStock,
        detail_number=detail_number,
        image=main_image
    )
    
    session.add(product_data)
    session.commit()
    session.refresh(product_data)
    
    # Save additional images to ProductImage table
    for url in image_urls:
        product_image = ProductImage(product_id=product_id, url=url)
        session.add(product_image)
    
    session.commit()
    session.refresh(product_data) # Refresh to get relationships
    
    session.commit()
    session.refresh(product_data) # Refresh to get relationships
    
    # Construct response manually to avoid modifying the SQLModel relationship with strings
    response_data = product_data.model_dump()
    response_data["images"] = [img.url for img in product_data.images]
    
    return ProductRead(**response_data)

@router.put("/{product_id}", response_model=ProductRead, dependencies=[Depends(verify_admin)])
async def update_product(
    product_id: str,
    name: str = Form(...),
    category: str = Form(...),
    subcategory_id: Optional[int] = Form(None),
    priceUAH: float = Form(...),
    priceUSD: float = Form(...),
    description: str = Form(...),
    inStock: bool = Form(...),
    detail_number: Optional[str] = Form(None),
    image: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    kept_images: List[str] = Form(None),
    session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update basic fields
    product.name = name
    product.category = category
    product.subcategory_id = subcategory_id
    product.priceUAH = priceUAH
    product.priceUSD = priceUSD
    product.description = description
    product.inStock = inStock
    product.detail_number = detail_number
    
    # Update main image if provided
    if image:
        product.image = image
    
    # Handle image deletion (kept_images)
    # If kept_images is provided (even empty list), we sync the gallery.
    # If it's None, we assume no changes to existing gallery unless files are added.
    # However, Form(None) for list might be tricky. Let's assume frontend sends it if it wants to manage images.
    if kept_images is not None:
        # Get current images
        current_images = session.exec(select(ProductImage).where(ProductImage.product_id == product_id)).all()
        for img in current_images:
            if img.url not in kept_images:
                session.delete(img)
    
    # Handle new file uploads
    new_image_urls = []
    if files:
        for file in files:
            if file.filename:
                url = await image_uploader.upload_image(file, folder="tesla-parts/products")
                if url:
                    new_image_urls.append(url)

    session.add(product)
    session.commit()
    
    # Add new images to gallery
    for url in new_image_urls:
        product_image = ProductImage(product_id=product_id, url=url)
        session.add(product_image)
        
    session.commit()
    session.refresh(product)
    
    response_data = product.model_dump()
    # Re-fetch images to get updated list
    updated_images = session.exec(select(ProductImage).where(ProductImage.product_id == product_id)).all()
    response_data["images"] = [img.url for img in updated_images]
    return ProductRead(**response_data)

@router.delete("/{product_id}", dependencies=[Depends(verify_admin)])
def delete_product(product_id: str, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.delete(product)
    session.commit()
    return {"ok": True}
