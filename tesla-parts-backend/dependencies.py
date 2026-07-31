from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select # Import Session and select
from models import User, Customer # Import User model
from database import get_session # Import get_session
from auth import verify_token
from services.crypto import get_email_hash

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_admin(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user # Return the user object

async def get_optional_customer(request: Request, session: Session = Depends(get_session)):
    token = request.cookies.get("customerToken")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        return None
        
    payload = verify_token(token)
    if not payload:
        return None
        
    email = payload.get("sub")
    role = payload.get("role")
    
    if role != "customer" or not email:
        return None
        
    email_hash = get_email_hash(email)
    customer = session.exec(select(Customer).where(Customer.email_hash == email_hash)).first()
    return customer

async def get_current_customer(customer: Customer = Depends(get_optional_customer)):
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate customer credentials",
        )
    return customer

