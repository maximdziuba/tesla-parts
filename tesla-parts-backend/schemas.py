from pydantic import BaseModel
from typing import List
from datetime import datetime

class ProductBase(BaseModel):
    id: str
    name: str
    category: str
    priceUSD: float | None = None
    priceUAH: float
    image: str
    description: str
    inStock: bool
    detail_number: str | None = None
    cross_number: str | None = None # Made optional
    meta_title: str | None = None
    meta_description: str | None = None


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
    subcategory_ids: List[int] = []
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
    sort_order: int
    meta_title: str | None = None
    meta_description: str | None = None
    subcategories: List[SubcategoryRead] = []

class CategoryCreate(BaseModel):
    name: str
    image: str | None = None
    sort_order: int | None = None
    meta_title: str | None = None
    meta_description: str | None = None

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
    totalUSD: float | None = None
    customer: Customer
    delivery: Delivery
    paymentMethod: str
    ttn: str | None = None # Added TTN field

class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float

class OrderRead(BaseModel):
    id: int
    status: str
    totalUSD: float
    totalUAH: float = 0.0
    customer_first_name: str
    customer_last_name: str
    customer_phone: str
    delivery_city: str
    delivery_branch: str
    payment_method: str
    ttn: str | None = None # Added TTN field
    created_at: datetime
    items: List[OrderItemRead]


class ProductBulkDeleteRequest(BaseModel):
    product_ids: List[str]

class SocialLinks(BaseModel):
    instagram: str | None = None
    telegram: str | None = None

class StaticPageSEOBase(BaseModel):
    slug: str
    meta_title: str | None = None
    meta_description: str | None = None

class StaticPageSEORead(StaticPageSEOBase):
    id: int

class StaticPageSEOUpdate(BaseModel):
    meta_title: str | None = None
    meta_description: str | None = None
