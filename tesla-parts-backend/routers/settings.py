from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Settings
from pydantic import BaseModel
from typing import List
from schemas import SocialLinks
import os
from dependencies import get_current_admin



router = APIRouter(
    prefix="/settings",
    tags=["settings"],
)

class SettingUpdate(BaseModel):
    value: str

@router.get("/social-links", response_model=SocialLinks)
def get_social_links(session: Session = Depends(get_session)):
    instagram_link = session.get(Settings, "instagram_link")
    telegram_link = session.get(Settings, "telegram_link")
    return SocialLinks(
        instagram=instagram_link.value if instagram_link else "",
        telegram=telegram_link.value if telegram_link else ""
    )

@router.post("/social-links", dependencies=[Depends(get_current_admin)])
def update_social_links(links: SocialLinks, session: Session = Depends(get_session)):
    instagram_link = session.get(Settings, "instagram_link")
    if not instagram_link:
        instagram_link = Settings(key="instagram_link", value=links.instagram or "")
        session.add(instagram_link)
    else:
        instagram_link.value = links.instagram or ""
        session.add(instagram_link)

    telegram_link = session.get(Settings, "telegram_link")
    if not telegram_link:
        telegram_link = Settings(key="telegram_link", value=links.telegram or "")
        session.add(telegram_link)
    else:
        telegram_link.value = links.telegram or ""
        session.add(telegram_link)

    session.commit()
    return {"message": "Social links updated successfully"}


@router.get("/", dependencies=[Depends(get_current_admin)])
def get_all_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(Settings)).all()
    return settings

@router.get("/{key}")
def get_setting(key: str, session: Session = Depends(get_session)):
    setting = session.get(Settings, key)
    if not setting:
        # Return defaults if not found
        if key == "exchange_rate":
            return {"key": key, "value": "40.0"}
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/{key}", dependencies=[Depends(get_current_admin)])
def update_setting(key: str, update: SettingUpdate, session: Session = Depends(get_session)):
    setting = session.get(Settings, key)
    if not setting:
        setting = Settings(key=key, value=update.value)
        session.add(setting)
    else:
        setting.value = update.value
        session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting
