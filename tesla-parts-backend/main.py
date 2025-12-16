from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from routers import products, orders, categories, settings, pages, auth # Import auth router
from contextlib import asynccontextmanager
import os
from models import Product, Category

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS Configuration
# Add your production frontend URLs here
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://teslapartscenter.com.ua",
    "https://www.teslapartscenter.com.ua",
    "https://admin.teslapartscenter.com.ua",
]

# Add frontend URL from environment variable if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    # Also add with trailing slash
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(settings.router)
app.include_router(pages.router)
app.include_router(auth.router) # Include auth router

@app.get("/")
def read_root():
    return {"message": "Tesla Parts API is running"}

def _slugify(value: str) -> str:
    return (
        value.lower()
        .strip()
        .replace(" ", "-")
        .replace("/", "-")
    )

@app.get("/sitemap.xml", response_class=Response)
def get_sitemap():
    base_url = "https://teslapartscenter.com.ua"
    with Session(engine) as session:
        products = session.exec(select(Product)).all()
        categories = session.exec(select(Category)).all()

    xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    xml_parts.append(f'<url><loc>{base_url}/</loc><changefreq>daily</changefreq></url>')

    for category in categories:
        slug = _slugify(category.name) if category.name else f"category/{category.id}"
        xml_parts.append(f'<url><loc>{base_url}/{slug}</loc><changefreq>weekly</changefreq></url>')

    for product in products:
        xml_parts.append(f'<url><loc>{base_url}/product/{product.id}</loc><changefreq>weekly</changefreq></url>')

    xml_parts.append("</urlset>")

    return Response(content="".join(xml_parts), media_type="application/xml")
