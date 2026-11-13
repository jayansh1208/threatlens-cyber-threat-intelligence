import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "backend" / ".env")


def get_setting(name: str, default: Any = None) -> Any:
    value = os.getenv(name)
    if value is None:
        return default
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.isdigit():
        return int(value)
    return value


def get_list_setting(name: str, default: list[str] | None = None) -> list[str]:
    raw_value = get_setting(name, "")
    if raw_value:
        return [item.strip() for item in str(raw_value).split(",") if item.strip()]
    return default or []


MONGO_URI = get_setting("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = get_setting("DATABASE_NAME", "threatlens")
BACKEND_PORT = get_setting("BACKEND_PORT", 8000)
FRONTEND_ORIGINS = get_list_setting(
    "FRONTEND_ORIGINS",
    ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
)


def get_db_name() -> str:
    return DATABASE_NAME
