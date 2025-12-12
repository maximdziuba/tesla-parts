import pytest
from fastapi.testclient import TestClient
from main import app
from models import Product, Order, OrderItem
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from database import get_session

# Use in-memory DB for tests
sqlite_url = "sqlite:///:memory:"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, poolclass=StaticPool)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = get_session_override

client = TestClient(app)

@pytest.fixture(name="session")
def session_fixture():
    create_db_and_tables()
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Tesla Parts API is running"}

def test_create_product(session: Session):
    product_data = {
        "id": "test-001",
        "name": "Test Product",
        "category": "Test",
        "priceUAH": 100.0,
        "image": "http://example.com/image.png",
        "description": "Test Description",
        "inStock": True
    }
    response = client.post("/products/", json=product_data, headers={"x-admin-secret": "secret"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["id"] == "test-001"

def test_create_order(session: Session):
    # First create a product
    product_data = {
        "id": "test-001",
        "name": "Test Product",
        "category": "Test",
        "priceUAH": 100.0,
        "image": "http://example.com/image.png",
        "description": "Test Description",
        "inStock": True
    }
    client.post("/products/", json=product_data, headers={"x-admin-secret": "secret"})

    order_data = {
        "items": [{"id": "test-001", "name": "Test Product", "category": "Test", "priceUAH": 100.0, "image": "...", "description": "...", "inStock": True, "quantity": 2}],
        "totalUAH": 200.0,
        "customer": {"firstName": "John", "lastName": "Doe", "phone": "1234567890"},
        "delivery": {"city": "Kyiv", "branch": "1"},
        "paymentMethod": "card"
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "created"
    assert "id" in data
