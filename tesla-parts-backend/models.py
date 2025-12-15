from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    image: Optional[str] = None
    sort_order: int = Field(default=0, index=True)
    
    subcategories: List["Subcategory"] = Relationship(back_populates="category")

class ProductSubcategoryLink(SQLModel, table=True):
    product_id: str = Field(foreign_key="product.id", primary_key=True)
    subcategory_id: int = Field(foreign_key="subcategory.id", primary_key=True)


class Subcategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: Optional[str] = None
    image: Optional[str] = None
    category_id: int = Field(foreign_key="category.id")
    parent_id: Optional[int] = Field(default=None, foreign_key="subcategory.id")
    
    category: Category = Relationship(back_populates="subcategories")
    parent: Optional["Subcategory"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Subcategory.id"})
    children: List["Subcategory"] = Relationship(back_populates="parent")
    products: List["Product"] = Relationship(back_populates="subcategory")
    linked_products: List["Product"] = Relationship(
        back_populates="linked_subcategories",
        link_model=ProductSubcategoryLink,
    )

class Product(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    category: str # Deprecated, keeping for backward compatibility
    subcategory_id: Optional[int] = Field(default=None, foreign_key="subcategory.id")
    priceUAH: float
    priceUSD: float = Field(default=0.0)
    image: str
    description: str
    inStock: bool
    detail_number: Optional[str] = None
    cross_number: str = Field(default="")
    
    subcategory: Optional[Subcategory] = Relationship(back_populates="products")
    linked_subcategories: List[Subcategory] = Relationship(
        back_populates="linked_products",
        link_model=ProductSubcategoryLink,
    )
    images: List["ProductImage"] = Relationship(back_populates="product", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class ProductImage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: str = Field(foreign_key="product.id")
    url: str
    
    product: Product = Relationship(back_populates="images")

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
    product: Optional["Product"] = Relationship()

class Settings(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str

class Page(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)
    title: str
    content: str
    is_published: bool = Field(default=True)
    location: str = Field(default="footer") # header, footer, both, none
