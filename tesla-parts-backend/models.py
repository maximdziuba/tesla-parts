from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class Product(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    category: str
    priceUAH: float
    image: str
    description: str
    inStock: bool

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_first_name: str
    customer_last_name: str
    customer_phone: str
    delivery_city: str
    delivery_branch: str
    payment_method: str
    totalUAH: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="new")
    
    items: List["OrderItem"] = Relationship(back_populates="order")

class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: Optional[int] = Field(default=None, foreign_key="order.id")
    product_id: str = Field(foreign_key="product.id")
    quantity: int
    price_at_purchase: float
    
    order: Optional[Order] = Relationship(back_populates="items")
