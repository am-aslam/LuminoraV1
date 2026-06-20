import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
env_path = ROOT_DIR / ".env"
load_dotenv(env_path)

mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME") or "luminora"

if not mongo_url:
    try:
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[db_name]
        print("Using in-memory AsyncMongoMockClient database.")
    except ImportError:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client[db_name]
        print("Fallback: Using local MongoDB client on default port.")
else:
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
