from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Category, Subcategory, Product, ProductImage
from schemas import (
    CategoryRead,
    CategoryCreate,
    SubcategoryRead,
    SubcategoryCreate,
    SubcategoryTransferRequest,
)
from services.image_uploader import image_uploader

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

def _validate_target_parent(
    session: Session,
    target_parent_id: Optional[int],
    target_category_id: int,
    moving_subcategory_id: Optional[int] = None,
) -> Optional[Subcategory]:
    if target_parent_id is None:
        return None

    if moving_subcategory_id is not None and target_parent_id == moving_subcategory_id:
        raise HTTPException(status_code=400, detail="Cannot set a subcategory as its own parent")

    parent = session.get(Subcategory, target_parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Target parent subcategory not found")

    if parent.category_id != target_category_id:
        raise HTTPException(status_code=400, detail="Target parent belongs to another category")

    # Ensure we are not assigning a descendant as parent
    if moving_subcategory_id:
        current = parent
        while current:
            if current.id == moving_subcategory_id:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot move subcategory inside its own descendant",
                )
            if current.parent_id is None:
                break
            current = session.get(Subcategory, current.parent_id)

    return parent


def _update_subtree_category(
    session: Session,
    subcategory: Subcategory,
    new_category_id: int,
    new_category_name: str,
):
    subcategory.category_id = new_category_id
    session.add(subcategory)

    products = session.exec(
        select(Product).where(Product.subcategory_id == subcategory.id)
    ).all()
    for product in products:
        product.category = new_category_name
        session.add(product)

    children = session.exec(
        select(Subcategory).where(Subcategory.parent_id == subcategory.id)
    ).all()
    for child in children:
        _update_subtree_category(session, child, new_category_id, new_category_name)


def _clone_subcategory_tree(
    session: Session,
    source_subcategory: Subcategory,
    target_category_id: int,
    target_category_name: str,
    parent_id: Optional[int],
) -> Subcategory:
    new_subcategory = Subcategory(
        name=source_subcategory.name,
        code=source_subcategory.code,
        image=source_subcategory.image,
        category_id=target_category_id,
        parent_id=parent_id,
    )
    session.add(new_subcategory)
    session.flush()  # Get ID for children

    products = session.exec(
        select(Product).where(Product.subcategory_id == source_subcategory.id)
    ).all()
    for product in products:
        new_product_id = f"{product.id}-copy-{uuid4().hex[:6]}"
        new_product = Product(
            id=new_product_id,
            name=product.name,
            category=target_category_name,
            subcategory_id=new_subcategory.id,
            priceUAH=product.priceUAH,
            priceUSD=product.priceUSD,
            description=product.description,
            inStock=product.inStock,
            detail_number=product.detail_number,
            image=product.image,
        )
        session.add(new_product)
        session.flush()

        images = session.exec(
            select(ProductImage).where(ProductImage.product_id == product.id)
        ).all()
        for image in images:
            session.add(ProductImage(product_id=new_product_id, url=image.url))

    children = session.exec(
        select(Subcategory).where(Subcategory.parent_id == source_subcategory.id)
    ).all()
    for child in children:
        _clone_subcategory_tree(
            session,
            child,
            target_category_id,
            target_category_name,
            new_subcategory.id,
        )

    return new_subcategory


def _load_subcategories_for_category(
    session: Session, category_id: int
) -> List[Subcategory]:
    return session.exec(
        select(Subcategory)
        .where(Subcategory.category_id == category_id)
        .options(
            selectinload(Subcategory.products).selectinload(Product.images),
        )
    ).all()


def _serialize_subcategory_tree(
    root: Subcategory, all_subs: List[Subcategory]
) -> SubcategoryRead:
    sub_data = root.model_dump()
    products_data = []
    for product in root.products:
        prod_data = product.model_dump()
        prod_data["images"] = [img.url for img in product.images]
        products_data.append(prod_data)
    sub_data["products"] = products_data

    children = [sub for sub in all_subs if sub.parent_id == root.id]
    sub_data["subcategories"] = [
        _serialize_subcategory_tree(child, all_subs) for child in children
    ]
    return SubcategoryRead(**sub_data)


def _build_subcategory_response(
    session: Session, subcategory_id: int
) -> SubcategoryRead:
    subcategory = session.exec(
        select(Subcategory)
        .where(Subcategory.id == subcategory_id)
        .options(
            selectinload(Subcategory.products).selectinload(Product.images),
        )
    ).one()
    all_subs = _load_subcategories_for_category(session, subcategory.category_id)
    return _serialize_subcategory_tree(subcategory, all_subs)


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
    return _build_subcategory_response(session, db_subcategory.id)

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
    return _build_subcategory_response(session, subcategory.id)

@router.post("/subcategories/{subcategory_id}/move", response_model=SubcategoryRead)
def move_subcategory(
    subcategory_id: int,
    transfer: SubcategoryTransferRequest,
    session: Session = Depends(get_session),
):
    subcategory = session.get(Subcategory, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    target_category = session.get(Category, transfer.target_category_id)
    if not target_category:
        raise HTTPException(status_code=404, detail="Target category not found")

    _validate_target_parent(
        session,
        transfer.target_parent_id,
        transfer.target_category_id,
        moving_subcategory_id=subcategory_id,
    )

    _update_subtree_category(
        session, subcategory, transfer.target_category_id, target_category.name
    )
    subcategory.parent_id = transfer.target_parent_id

    session.add(subcategory)
    session.commit()
    return _build_subcategory_response(session, subcategory.id)


@router.post("/subcategories/{subcategory_id}/copy", response_model=SubcategoryRead)
def copy_subcategory(
    subcategory_id: int,
    transfer: SubcategoryTransferRequest,
    session: Session = Depends(get_session),
):
    source_subcategory = session.get(Subcategory, subcategory_id)
    if not source_subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    target_category = session.get(Category, transfer.target_category_id)
    if not target_category:
        raise HTTPException(status_code=404, detail="Target category not found")

    _validate_target_parent(
        session,
        transfer.target_parent_id,
        transfer.target_category_id,
        moving_subcategory_id=None,
    )

    new_subcategory = _clone_subcategory_tree(
        session,
        source_subcategory,
        transfer.target_category_id,
        target_category.name,
        transfer.target_parent_id,
    )
    session.commit()
    return _build_subcategory_response(session, new_subcategory.id)


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
