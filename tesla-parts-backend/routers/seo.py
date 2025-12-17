from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import engine
from models import StaticPageSEO
from schemas import StaticPageSEORead, StaticPageSEOUpdate

router = APIRouter(prefix="/seo", tags=["seo"])

def get_session():
    with Session(engine) as session:
        yield session

@router.get("/static", response_model=List[StaticPageSEORead])
def get_all_static_seo(session: Session = Depends(get_session)):
    pages = session.exec(select(StaticPageSEO)).all()
    return pages

@router.get("/static/{slug}", response_model=StaticPageSEORead)
def get_static_seo(slug: str, session: Session = Depends(get_session)):
    page = session.exec(select(StaticPageSEO).where(StaticPageSEO.slug == slug)).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page SEO not found")
    return page

@router.put("/static/{slug}", response_model=StaticPageSEORead)
def update_static_seo(slug: str, page_update: StaticPageSEOUpdate, session: Session = Depends(get_session)):
    page = session.exec(select(StaticPageSEO).where(StaticPageSEO.slug == slug)).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page SEO not found")
    
    update_data = page_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(page, key, value)
    
    session.add(page)
    session.commit()
    session.refresh(page)
    return page
