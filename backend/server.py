import logging

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app_routes import app_router
from auth import auth_router, seed_admin
from academic import academic_router
from db import client
from llm_routes import llm_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await seed_admin()
    logger.info("Luminora Learning API started — seed accounts ready.")
    yield
    # Shutdown logic
    client.close()


app = FastAPI(title="Luminora Learning API", lifespan=lifespan)


@app.get("/api/")
async def root():
    return {"message": "Luminora Learning API", "status": "online"}


app.include_router(auth_router)
app.include_router(academic_router)
app.include_router(llm_router)
app.include_router(app_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
