from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from models import User
from database import get_session
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS, # Import REFRESH_TOKEN_EXPIRE_DAYS
    create_access_token,
    verify_password,
    get_password_hash,
)
from pydantic import BaseModel
import uuid # Import uuid for refresh token generation

router = APIRouter(prefix="/auth", tags=["auth"])

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str # Add refresh_token to Token schema

class ResetPasswordRequest(BaseModel):
    old_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильне ім'я користувача чи пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    refresh_token = str(uuid.uuid4()) # Generate a unique refresh token
    user.refresh_token = refresh_token # Store the refresh token in the user model
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/reset-password")
async def reset_admin_password(
    request: ResetPasswordRequest, session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == "admin")).first()
    if not user:
        raise HTTPException(status_code=500, detail="Admin user not found.")

    if not verify_password(request.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old password",
        )

    user.hashed_password = get_password_hash(request.new_password)
    session.add(user)
    session.commit()
    return {"message": "Admin password reset successfully."}

@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    request: RefreshTokenRequest, session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.refresh_token == request.refresh_token)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Generate a new refresh token and update in DB (rotating refresh tokens)
    new_refresh_token = str(uuid.uuid4())
    user.refresh_token = new_refresh_token
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"access_token": new_access_token, "token_type": "bearer", "refresh_token": new_refresh_token}
