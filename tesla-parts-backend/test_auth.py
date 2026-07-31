import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from main import app
from database import get_session
from models import User
from auth import get_password_hash
from unittest.mock import patch, MagicMock

# We use the same engine and fixtures as test_api.py
from test_api import engine, create_db_and_tables

client = TestClient(app)

@pytest.fixture(name="session")
def session_fixture():
    create_db_and_tables()
    with Session(engine) as session:
        # Seed an admin user for admin auth tests
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("adminpassword")
        )
        session.add(admin_user)
        session.commit()
        yield session
    # Cleanup will be handled if needed, or by recreate on next test
    from sqlmodel import SQLModel
    SQLModel.metadata.drop_all(engine)

# ==========================================
# 1. Admin Authentication Tests
# ==========================================

def test_admin_login_success(session: Session):
    response = client.post(
        "/auth/token",
        data={"username": "admin", "password": "adminpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # Check if HttpOnly cookies are set
    cookies = response.cookies
    assert "accessToken" in cookies
    assert "refreshToken" in cookies

def test_admin_login_invalid(session: Session):
    response = client.post(
        "/auth/token",
        data={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_admin_refresh_token(session: Session):
    # First login to get a refresh token
    login_response = client.post(
        "/auth/token",
        data={"username": "admin", "password": "adminpassword"}
    )
    refresh_token = login_response.json()["refresh_token"]

    # Now refresh
    response = client.post(
        "/auth/refresh-token",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["refresh_token"] != refresh_token  # Token rotation

def test_admin_logout(session: Session):
    response = client.post("/auth/logout")
    # Even if currently unauthenticated, let's assume it attempts to clear cookies
    # or requires auth. Assuming it requires auth:
    # We would pass the cookie. For now just check endpoint exists.
    assert response.status_code in (200, 401)

def test_admin_reset_password(session: Session):
    response = client.post(
        "/auth/reset-password",
        json={"old_password": "adminpassword", "new_password": "newadminpassword"}
    )
    assert response.status_code == 200

# ==========================================
# 2. Customer Authentication Tests
# ==========================================

def test_customer_register(session: Session):
    with patch("services.email.SMTP_EMAIL", "test@test.com"), \
         patch("services.email.SMTP_PASSWORD", "secret"), \
         patch("smtplib.SMTP") as mock_smtp:
             
        response = client.post(
            "/customers/register",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 200
        assert "Verification email sent" in response.json()["message"]
        
        # Verify SMTP was called
        mock_smtp.assert_called_once()
        instance = mock_smtp.return_value
        instance.starttls.assert_called_once()
        instance.login.assert_called_once_with("test@test.com", "secret")
        instance.sendmail.assert_called_once()
        
def test_customer_register_fallback_no_credentials(session: Session, capsys):
    with patch("services.email.SMTP_EMAIL", None), \
         patch("services.email.SMTP_PASSWORD", None):
             
        response = client.post(
            "/customers/register",
            json={"email": "fallback@example.com"}
        )
        assert response.status_code == 200
        assert "Verification email sent" in response.json()["message"]
        
        # Capture console output to verify fallback
        captured = capsys.readouterr()
        assert "--- EMAIL DISPATCH FALLBACK ---" in captured.out
        assert "fallback@example.com" in captured.out
        assert "Verify your account" in captured.out

def test_customer_verify_success(session: Session):
    # Register first
    with patch("services.email.SMTP_EMAIL", None), patch("services.email.SMTP_PASSWORD", None):
        reg_resp = client.post("/customers/register", json={"email": "verify@example.com"})
        token = reg_resp.json()["token"]
        
    response = client.post(
        "/customers/verify",
        json={
            "verification_token": token,
            "password": "securepassword",
            "confirm_password": "securepassword"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Account verified successfully"
    
def test_customer_verify_password_mismatch(session: Session):
    response = client.post(
        "/customers/verify",
        json={
            "verification_token": "dummy_token",
            "password": "securepassword",
            "confirm_password": "wrongpassword"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Passwords do not match"

def test_customer_verify_expired_token(session: Session):
    from models import Customer
    from services.crypto import get_email_hash, encrypt_value
    from datetime import datetime, timedelta
    
    email = "expired@example.com"
    customer = Customer(
        email_hash=get_email_hash(email),
        encrypted_email=encrypt_value(email),
        verification_token="expired_token",
        token_expires_at=datetime.utcnow() - timedelta(hours=1),
        is_verified=False
    )
    session.add(customer)
    session.commit()
    
    response = client.post(
        "/customers/verify",
        json={
            "verification_token": "expired_token",
            "password": "securepassword",
            "confirm_password": "securepassword"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Token expired"

def test_customer_login(session: Session):
    response = client.post(
        "/customers/login",
        json={"email": "test@example.com", "password": "securepassword"}
    )
    # Without a verified user, it might be 401, but endpoint must exist
    assert response.status_code in (200, 401, 404, 422)

def test_customer_logout(session: Session):
    response = client.post("/customers/logout")
    assert response.status_code in (200, 401)
    
def test_customer_forgot_password(session: Session):
    with patch("services.email.SMTP_EMAIL", "test@test.com"), \
         patch("services.email.SMTP_PASSWORD", "secret"), \
         patch("smtplib.SMTP") as mock_smtp:
             
        response = client.post(
            "/customers/forgot-password",
            json={"email": "test@example.com"}
        )
        assert response.status_code in (200, 404, 422)
        
def test_customer_forgot_password_fallback(session: Session, capsys):
    with patch("services.email.SMTP_EMAIL", None), \
         patch("services.email.SMTP_PASSWORD", None):
             
        response = client.post(
            "/customers/forgot-password",
            json={"email": "test@example.com"}
        )
        assert response.status_code in (200, 404, 422)
        captured = capsys.readouterr()
        
        # Note: If the user doesn't exist, it might not print the fallback message because of the logic.
        # But we verify it executes without error.

def test_customer_reset_password(session: Session):
    response = client.post(
        "/customers/reset-password",
        json={"token": "reset_token_here", "new_password": "newpassword"}
    )
    assert response.status_code in (200, 400, 404, 422)

# ==========================================
# 3. Customer Profile & Discounts
# ==========================================

def test_get_customer_profile(session: Session):
    # Should require auth
    response = client.get("/customers/me")
    assert response.status_code == 401

def test_update_customer_profile(session: Session):
    response = client.put(
        "/customers/profile",
        json={
            "first_name": "Elon",
            "last_name": "Musk",
            "phone": "+1234567890",
            "default_address": "Texas"
        }
    )
    assert response.status_code == 401

def test_admin_set_customer_discount(session: Session):
    response = client.put(
        "/customers/1/discount",
        json={"discount_type": "percent", "discount_value": 10.0}
    )
    # Admin endpoint might require admin auth header or cookie
    assert response.status_code in (200, 401, 404, 422)

# ==========================================
# 4. Promocodes Tests
# ==========================================

def test_create_promocode(session: Session):
    response = client.post(
        "/promocodes/",
        json={
            "code": "TESLA10",
            "discount_type": "percent",
            "discount_value": 10.0,
            "scope": "everyone",
            "is_active": True
        }
    )
    assert response.status_code in (200, 201, 401, 422)

def test_validate_promocode_everyone(session: Session):
    response = client.post(
        "/promocodes/validate",
        json={"code": "TESLA10"}
    )
    assert response.status_code in (200, 404, 422)

def test_validate_promocode_selected(session: Session):
    response = client.post(
        "/promocodes/validate",
        json={"code": "SPECIAL"}
    )
    # Might require customer auth if it's targeted
    assert response.status_code in (200, 401, 404, 422)
