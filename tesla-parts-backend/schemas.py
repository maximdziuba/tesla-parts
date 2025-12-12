from pydantic import BaseModel
from typing import List

class ProductBase(BaseModel):
    id: str
    name: str
    category: str
    priceUAH: float
    image: str
    description: str
    inStock: bool

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    pass

class CartItem(ProductBase):
    quantity: int

class Customer(BaseModel):
    firstName: str
    lastName: str
    phone: str

class Delivery(BaseModel):
    city: str
    branch: str

class OrderCreate(BaseModel):
    items: List[CartItem]
    totalUAH: float
    customer: Customer
    delivery: Delivery
    paymentMethod: str
