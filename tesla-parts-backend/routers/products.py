from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select, delete
from typing import List, Optional
import shutil
import os
from sqlalchemy.orm import selectinload
from database import get_session
from models import Product, ProductImage, ProductSubcategoryLink
from schemas import ProductCreate, ProductRead, ProductBulkDeleteRequest
from services.image_uploader import image_uploader
from services.pricing import get_exchange_rate, compute_price_fields
from dependencies import get_current_admin

router = APIRouter(prefix="/products", tags=["products"])

PLACEHOLDER_IMAGE_URL = "https://via.placeholder.com/300"


def _collect_subcategory_ids(product: Product) -> List[int]:
    ids: List[int] = []
    if product.subcategory_id:
        ids.append(product.subcategory_id)
    if product.linked_subcategories:
        for sub in product.linked_subcategories:
            if sub.id and sub.id not in ids:
                ids.append(sub.id)
    return ids


def _build_product_response(product: Product, rate: float) -> ProductRead:
    price_usd, price_uah = compute_price_fields(product, rate)
    p_data = product.model_dump()
    p_data["priceUSD"] = price_usd
    p_data["priceUAH"] = price_uah
    p_data["images"] = [img.url for img in product.images]
    p_data["subcategory_ids"] = _collect_subcategory_ids(product)
    return ProductRead(**p_data)


def _normalize_subcategory_selection(
    primary_subcategory_id: Optional[int],
    extra_subcategory_ids: Optional[List[int]],
) -> List[int]:
    normalized: List[int] = []

    if primary_subcategory_id:
        normalized.append(primary_subcategory_id)

    if extra_subcategory_ids:
        for sub_id in extra_subcategory_ids:
            if sub_id and sub_id not in normalized:
                normalized.append(sub_id)

    return normalized


def _sync_linked_subcategories(
    session: Session, product_id: str, link_ids: List[int]
):
    session.exec(
        delete(ProductSubcategoryLink).where(
            ProductSubcategoryLink.product_id == product_id
        )
    )
    for sub_id in link_ids:
        session.add(
            ProductSubcategoryLink(
                product_id=product_id,
                subcategory_id=sub_id,
            )
        )
    session.commit()

@router.get("/", response_model=List[ProductRead])
def read_products(category: str = None, subcategory_id: int = None, session: Session = Depends(get_session)):
    query = select(Product).options(
        selectinload(Product.images),
        selectinload(Product.linked_subcategories),
    )
    if category:
        query = query.where(Product.category == category)
    if subcategory_id:
        query = query.where(Product.subcategory_id == subcategory_id)
    
    products = session.exec(query).all()
    rate = get_exchange_rate(session)
    return [_build_product_response(p, rate) for p in products]

@router.get("/{product_id}", response_model=ProductRead)
def read_product(product_id: str, session: Session = Depends(get_session)):
    product = session.exec(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.linked_subcategories),
        )
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    rate = get_exchange_rate(session)
    return _build_product_response(product, rate)

@router.get("/labels", tags=["labels"])
def read_labels(session: Session = Depends(get_session)):
    products = session.exec(select(Product)).all()
    categories = list(set(p.category for p in products))
    return categories

@router.post("/", response_model=ProductRead, dependencies=[Depends(get_current_admin)])
async def create_product(
    id: Optional[str] = Form(None),
    name: str = Form(...),
    category: str = Form(...),
    subcategory_id: Optional[int] = Form(None),
    subcategory_ids: List[int] = Form(None),
    priceUAH: float = Form(...),
    priceUSD: float = Form(...),
    description: str = Form(...),
    inStock: bool = Form(...),
    detail_number: Optional[str] = Form(None),
    cross_number: str = Form(...),
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
        main_image = PLACEHOLDER_IMAGE_URL

    normalized_subcategories = _normalize_subcategory_selection(
        subcategory_id,
        subcategory_ids,
    )
    primary_subcategory_id = (
        normalized_subcategories[0] if normalized_subcategories else None
    )

    rate = get_exchange_rate(session)

    product_data = Product(
        id=product_id,
        name=name,
        category=category,
        subcategory_id=primary_subcategory_id,
        priceUAH=priceUAH,
        priceUSD=priceUSD,
        description=description,
        inStock=inStock,
        detail_number=detail_number,
        cross_number=cross_number,
        image=main_image
    )
    if priceUSD:
        product_data.priceUAH = round(priceUSD * rate, 2)

    session.add(product_data)
    session.commit()
    session.refresh(product_data)

    _sync_linked_subcategories(
        session,
        product_id,
        normalized_subcategories[1:] if normalized_subcategories else [],
    )
    
    # Save additional images to ProductImage table
    for url in image_urls:
        product_image = ProductImage(product_id=product_id, url=url)
        session.add(product_image)
    
    session.commit()
    session.refresh(product_data) # Refresh to get relationships
    
    session.commit()
    session.refresh(product_data) # Refresh to get relationships
    
    # Construct response manually to avoid modifying the SQLModel relationship with strings
    return _build_product_response(product_data, rate)

@router.put("/{product_id}", response_model=ProductRead, dependencies=[Depends(get_current_admin)])
async def update_product(
    product_id: str,
    name: str = Form(...),
    category: str = Form(...),
    subcategory_id: Optional[int] = Form(None),
    subcategory_ids: List[int] = Form(None),
    priceUAH: float = Form(...),
    priceUSD: float = Form(...),
    description: str = Form(...),
    inStock: bool = Form(...),
    detail_number: Optional[str] = Form(None),
    cross_number: str = Form(...),
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
    product.priceUAH = priceUAH
    product.priceUSD = priceUSD
    product.description = description
    product.inStock = inStock
    product.detail_number = detail_number
    product.cross_number = cross_number
    
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

    normalized_subcategories = _normalize_subcategory_selection(
        subcategory_id,
        subcategory_ids,
    )
    product.subcategory_id = (
        normalized_subcategories[0] if normalized_subcategories else None
    )

    rate = get_exchange_rate(session)
    if priceUSD:
        product.priceUAH = round(priceUSD * rate, 2)

    session.add(product)
    session.commit()

    _sync_linked_subcategories(
        session,
        product_id,
        normalized_subcategories[1:] if normalized_subcategories else [],
    )
    
    # Add new images to gallery
    for url in new_image_urls:
        product_image = ProductImage(product_id=product_id, url=url)
        session.add(product_image)
        
    session.commit()
    session.refresh(product)
    
    updated_images = session.exec(
        select(ProductImage)
        .where(ProductImage.product_id == product_id)
        .order_by(ProductImage.id)
    ).all()

    new_primary_url = updated_images[0].url if updated_images else None
    image_updated = False

    if new_primary_url and product.image != new_primary_url:
        product.image = new_primary_url
        image_updated = True
    elif not new_primary_url and not product.image:
        product.image = PLACEHOLDER_IMAGE_URL
        image_updated = True

    if image_updated:
        session.add(product)
        session.commit()
        session.refresh(product)

    product.images = updated_images
    return _build_product_response(product, rate)

@router.delete("/{product_id}", dependencies=[Depends(get_current_admin)])
def delete_product(product_id: str, session: Session = Depends(get_session)):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.exec(
        delete(ProductSubcategoryLink).where(
            ProductSubcategoryLink.product_id == product_id
        )
    )
    session.delete(product)
    session.commit()
    return {"ok": True}


@router.post("/bulk-delete", dependencies=[Depends(get_current_admin)])
def bulk_delete_products(
    request: ProductBulkDeleteRequest,
    session: Session = Depends(get_session),
):
    if not request.product_ids:
        return {"deleted": 0}

    session.exec(
        delete(ProductSubcategoryLink).where(
            ProductSubcategoryLink.product_id.in_(request.product_ids)
        )
    )

    products = session.exec(
        select(Product).where(Product.id.in_(request.product_ids))
    ).all()

    for product in products:
        session.delete(product)

    session.commit()
    return {"deleted": len(products)}
