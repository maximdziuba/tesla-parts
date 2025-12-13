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

class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float

class OrderRead(BaseModel):
    id: int
    status: str
    totalUAH: float
    customer_first_name: str
    customer_last_name: str
    customer_phone: str
    delivery_city: str
    delivery_branch: str
    payment_method: str
    items: List[OrderItemRead]

class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float

class OrderRead(BaseModel):
    id: int
    status: str
    totalUAH: float
    customer_first_name: str
    customer_last_name: str
    customer_phone: str
    delivery_city: str
    delivery_branch: str
    payment_method: str
    items: List[OrderItemRead]
