from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import products, orders, categories, settings, pages
from contextlib import asynccontextmanager
import os

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
    "http://teslapartscenter.com.ua",
    "http://www.teslapartscenter.com.ua",
    "http://admin.teslapartscenter.com.ua",
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

@app.get("/")
def read_root():
    return {"message": "Tesla Parts API is running"}
