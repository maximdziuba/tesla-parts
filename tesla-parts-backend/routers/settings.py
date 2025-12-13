from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Settings
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/settings", tags=["settings"])

class SettingUpdate(BaseModel):
    value: str

@router.get("/")
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

@router.post("/{key}")
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
