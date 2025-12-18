from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Page
from pydantic import BaseModel

router = APIRouter(prefix="/pages", tags=["pages"])

class PageCreate(BaseModel):
    slug: str
    title: str
    content: str
    is_published: bool = True
    location: str = "footer"

class PageUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    location: Optional[str] = None

class PagesRequest(BaseModel):
    slugs: List[str]

@router.post("/by-slugs", response_model=List[Page])
def get_pages_by_slugs(req: PagesRequest, session: Session = Depends(get_session)):
    if not req.slugs:
        return []
    pages = session.exec(select(Page).where(Page.slug.in_(req.slugs))).all()
    slug_map = {page.slug: page for page in pages}
    # Return pages in the order of requested slugs
    return [slug_map[slug] for slug in req.slugs if slug in slug_map]

@router.get("/", response_model=List[Page])
def read_pages(
    offset: int = 0,
    limit: int = Query(default=100, le=100),
    session: Session = Depends(get_session)
):
    pages = session.exec(select(Page).offset(offset).limit(limit)).all()
    return pages

@router.get("/{slug_or_id}", response_model=Page)
def read_page(slug_or_id: str, session: Session = Depends(get_session)):
    # Try ID first if integer
    if slug_or_id.isdigit():
        page = session.get(Page, int(slug_or_id))
        if page:
            return page
            
    # Try slug
    page = session.exec(select(Page).where(Page.slug == slug_or_id)).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.post("/", response_model=Page)
def create_page(page: PageCreate, session: Session = Depends(get_session)):
    # Check if slug exists
    existing_page = session.exec(select(Page).where(Page.slug == page.slug)).first()
    if existing_page:
        raise HTTPException(status_code=400, detail="Page with this slug already exists")
        
    db_page = Page.from_orm(page)
    session.add(db_page)
    session.commit()
    session.refresh(db_page)
    return db_page

@router.put("/{page_id}", response_model=Page)
def update_page(page_id: int, page_update: PageUpdate, session: Session = Depends(get_session)):
    db_page = session.get(Page, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
        
    page_data = page_update.dict(exclude_unset=True)
    for key, value in page_data.items():
        setattr(db_page, key, value)
        
    session.add(db_page)
    session.commit()
    session.refresh(db_page)
    return db_page

@router.delete("/{page_id}")
def delete_page(page_id: int, session: Session = Depends(get_session)):
    page = session.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    session.delete(page)
    session.commit()
    return {"ok": True}
