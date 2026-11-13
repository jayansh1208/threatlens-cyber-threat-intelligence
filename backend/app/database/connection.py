import os
from pathlib import Path
from typing import Any

from pymongo import MongoClient
from pymongo.database import Database

from app.config import DATABASE_NAME, MONGO_URI

ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT_DIR / "data"


def build_database_client() -> Database:
    mongo_uri = os.getenv("MONGO_URI", MONGO_URI)
    database_name = os.getenv("DATABASE_NAME", DATABASE_NAME)
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        return client[database_name]
    except Exception as exc:
        raise RuntimeError(
            f"MongoDB connection failed for {mongo_uri}. Start your local MongoDB at mongodb://localhost:27017 and retry."
        ) from exc


client = build_database_client()
db: Database = client


def get_db() -> Database:
    return db


def ensure_indexes() -> None:
    threat_reports = db.threat_reports
    threat_sources = db.threat_sources
    threat_indicators = db.threat_indicators
    classifications = db.classifications

    threat_reports.create_index([("category", 1)])
    threat_reports.create_index([("severity", 1)])
    threat_reports.create_index([("published_at", -1)])
    threat_reports.create_index([("source_id", 1)])
    threat_reports.create_index([("tags", 1)])
    threat_reports.create_index([("title", "text"), ("description", "text")])
    threat_reports.create_index([("category", 1), ("severity", 1), ("published_at", -1)])
    threat_reports.create_index([("source_id", 1), ("published_at", -1)])

    threat_sources.create_index([("source_name", 1)], unique=True)
    threat_sources.create_index([("source_url", 1)])
    threat_indicators.create_index([("report_id", 1)])
    classifications.create_index([("category", 1)], unique=True)


def load_sample_reports() -> int:
    file_path = DATA_DIR / "sample_reports.json"
    if not file_path.exists():
        return 0

    import json

    with open(file_path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    sources = payload.get("sources", [])
    if sources and db.threat_sources.count_documents({}) == 0:
        for source in sources:
            existing = db.threat_sources.find_one({"source_name": source["source_name"]})
            if not existing:
                db.threat_sources.insert_one(source)

    reports = payload.get("reports", [])
    if reports and db.threat_reports.count_documents({}) == 0:
        for report in reports:
            source = db.threat_sources.find_one({"source_name": report.get("source_name")})
            if source:
                report["source_id"] = str(source["_id"])
                report["source_name"] = source["source_name"]
            report.setdefault("origin", "synthetic")
            report.setdefault("classification", {
                "method": "rule_based",
                "confidence": 0.0,
                "category": report.get("category", "Other"),
            })
            report.setdefault("created_at", report.get("published_at"))
            if "_id" in report:
                report.pop("_id")
            db.threat_reports.insert_one(report)

    return db.threat_reports.count_documents({})


def get_database_stats() -> dict[str, Any]:
    stats = db.command("dbStats")
    collection_stats = {name: db[name].count_documents({}) for name in ["threat_reports", "threat_sources", "threat_indicators", "classifications"]}
    return {
        "db": DATABASE_NAME,
        "collections": collection_stats,
        "objects": stats.get("objects", 0),
        "data_points": collection_stats.get("threat_reports", 0),
    }
