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
    detail_number: str | None = None


class CartItem(ProductBase):
    quantity: int

class Customer(BaseModel):
    firstName: str
    lastName: str
    phone: str

class Delivery(BaseModel):
    city: str
    branch: str

class ProductCreate(ProductBase):
    subcategory_id: int | None = None

class ProductRead(ProductBase):
    subcategory_id: int | None = None
    images: List[str] = []
    subcategory_ids: List[int] = []

class SubcategoryRead(BaseModel):
    id: int
    name: str
    code: str | None = None
    image: str | None = None
    category_id: int
    parent_id: int | None = None
    products: List[ProductRead] = []
    subcategories: List["SubcategoryRead"] = []

class CategoryRead(BaseModel):
    id: int
    name: str
    image: str | None = None
    subcategories: List[SubcategoryRead] = []

class CategoryCreate(BaseModel):
    name: str
    image: str | None = None

class SubcategoryCreate(BaseModel):
    name: str
    code: str | None = None
    image: str | None = None
    category_id: int
    parent_id: int | None = None


class SubcategoryTransferRequest(BaseModel):
    target_category_id: int
    target_parent_id: int | None = None

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
