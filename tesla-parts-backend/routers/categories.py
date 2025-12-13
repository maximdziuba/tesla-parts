from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Category, Subcategory, Product
from schemas import CategoryRead, CategoryCreate, SubcategoryRead, SubcategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryRead])
def get_categories(session: Session = Depends(get_session)):
    categories = session.exec(
        select(Category)
        .options(
            selectinload(Category.subcategories)
            .selectinload(Subcategory.products)
            .selectinload(Product.images)
        )
    ).all()
    
    def build_subcategory_tree(sub: Subcategory, all_subs: List[Subcategory]) -> SubcategoryRead:
        sub_data = sub.model_dump()
        
        # Handle products
        products_data = []
        for prod in sub.products:
            prod_data = prod.model_dump()
            prod_data["images"] = [img.url for img in prod.images]
            products_data.append(prod_data)
        sub_data["products"] = products_data
        
        # Handle children subcategories
        children = [s for s in all_subs if s.parent_id == sub.id]
        sub_data["subcategories"] = [build_subcategory_tree(child, all_subs) for child in children]
        
        return SubcategoryRead(**sub_data)

    # Manually map to Pydantic models to handle nested images conversion and recursive subcategories
    result = []
    for cat in categories:
        cat_data = cat.model_dump()
        
        # Filter for top-level subcategories (no parent)
        root_subs = [s for s in cat.subcategories if s.parent_id is None]
        
        # Build tree for each root subcategory
        # We pass cat.subcategories (all subs in this category) to find children
        cat_data["subcategories"] = [build_subcategory_tree(sub, cat.subcategories) for sub in root_subs]
        
        result.append(CategoryRead(**cat_data))
        
    return result

@router.post("/", response_model=CategoryRead)
async def create_category(
    name: str = Form(...),
    image: str = Form(None),
    file: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    # Handle file upload
    image_url = image
    if file and file.filename:
        image_url = await image_uploader.upload_image(file, folder="tesla-parts/categories")

    db_category = Category(name=name, image=image_url)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category

@router.post("/{category_id}/subcategories/", response_model=SubcategoryRead)
async def create_subcategory(
    category_id: int,
    name: str = Form(...),
    code: str = Form(None),
    parent_id: int = Form(None),
    image: str = Form(None),
    file: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    # Handle file upload
    image_url = image
    if file and file.filename:
        image_url = await image_uploader.upload_image(file, folder="tesla-parts/subcategories")

    db_subcategory = Subcategory(
        name=name,
        code=code,
        category_id=category_id,
        parent_id=parent_id,
        image=image_url
    )
    session.add(db_subcategory)
    session.commit()
    session.refresh(db_subcategory)
    return db_subcategory

@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    name: str = Form(...),
    image: str = Form(None),
    file: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.name = name
    
    # Handle file upload
    if file and file.filename:
        image_url = await image_uploader.upload_image(file, folder="tesla-parts/categories")
        if image_url:
            category.image = image_url
    elif image:
        category.image = image
        
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

@router.put("/subcategories/{subcategory_id}", response_model=SubcategoryRead)
async def update_subcategory(
    subcategory_id: int,
    name: str = Form(...),
    code: str = Form(None),
    parent_id: int = Form(None),
    image: str = Form(None),
    file: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    subcategory = session.get(Subcategory, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
        
    subcategory.name = name
    subcategory.code = code
    # Only update parent_id if it's provided (or explicitly None if we want to move to root, but Form(None) makes it hard to distinguish missing vs null. 
    # For now assume if provided it changes. If not provided (None), keep existing? 
    # Actually Form(None) means it defaults to None if not sent. 
    # Let's assume we send current value if not changing.
    if parent_id is not None:
        subcategory.parent_id = parent_id
        
    # Handle file upload
    if file and file.filename:
        image_url = await image_uploader.upload_image(file, folder="tesla-parts/subcategories")
        if image_url:
            subcategory.image = image_url
    elif image:
        subcategory.image = image
        
    session.add(subcategory)
    session.commit()
    session.refresh(subcategory)
    return subcategory

@router.delete("/{category_id}")
def delete_category(category_id: int, session: Session = Depends(get_session)):
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    session.delete(category)
    session.commit()
    return {"ok": True}

@router.delete("/subcategories/{subcategory_id}")
def delete_subcategory(subcategory_id: int, session: Session = Depends(get_session)):
    subcategory = session.get(Subcategory, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    session.delete(subcategory)
    session.commit()
    return {"ok": True}
