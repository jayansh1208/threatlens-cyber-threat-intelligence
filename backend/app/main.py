from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId

from app.config import BACKEND_PORT, FRONTEND_ORIGINS, MONGO_URI, DATABASE_NAME
from app.database.connection import db, ensure_indexes, get_database_stats, load_sample_reports
from app.services.classifier import classify_report

app = FastAPI(title="ThreatLens", version="1.0.0")

allowed_origins = FRONTEND_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ThreatReportPayload(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    source_id: str | None = None
    source_url: str | None = None
    published_at: str | None = None
    category: str | None = None
    severity: str | None = None
    tags: list[str] = []
    indicators: list[str] = []
    classification: dict | None = None
    origin: str = "synthetic"


@app.on_event("startup")
def startup_event() -> None:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        ensure_indexes()
        load_sample_reports()
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(f"MongoDB connection failed: {exc}") from exc


@app.get("/api/health")
def health() -> dict:
    try:
        db.command("ping")
        return {"status": "ok", "database": DATABASE_NAME, "ready": True}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB unavailable: {exc}") from exc


@app.get("/api/stats")
def summary_stats() -> dict:
    reports = db.threat_reports.count_documents({})
    critical = db.threat_reports.count_documents({"severity": "Critical"})
    high = db.threat_reports.count_documents({"severity": "High"})
    malware = db.threat_reports.count_documents({"category": "Malware"})
    ransomware = db.threat_reports.count_documents({"category": "Ransomware"})
    phishing = db.threat_reports.count_documents({"category": "Phishing"})
    sources = db.threat_sources.count_documents({})
    return {
        "total_reports": reports,
        "critical_reports": critical,
        "high_severity_reports": high,
        "malware_reports": malware,
        "ransomware_reports": ransomware,
        "phishing_reports": phishing,
        "sources": sources,
    }


@app.get("/api/threats")
def list_threats(
    page: int = 1,
    limit: int = 20,
    category: str | None = None,
    severity: str | None = None,
    source: str | None = None,
    year: int | None = None,
    sort: str = "published_at",
    order: str = "desc",
    q: str | None = None,
) -> dict:
    query: dict = {}
    if category:
        query["category"] = category
    if severity:
        query["severity"] = severity
    if source:
        query["source_name"] = source
    if year:
        query["published_at"] = {"$regex": f"^{year}"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$in": [q.lower()]}},
        ]

    skip = (page - 1) * limit
    sort_direction = -1 if order.lower() == "desc" else 1
    items = list(db.threat_reports.find(query).sort(sort, sort_direction).skip(skip).limit(limit))
    total = db.threat_reports.count_documents(query)
    for item in items:
        item["_id"] = str(item["_id"])
        source_doc = db.threat_sources.find_one({"_id": ObjectId(item.get("source_id"))}) if item.get("source_id") else None
        if source_doc:
            item["source_name"] = source_doc.get("source_name")
    return {"page": page, "limit": limit, "total": total, "items": items}


@app.get("/api/threats/{report_id}")
def get_threat(report_id: str) -> dict:
    try:
        item = db.threat_reports.find_one({"_id": ObjectId(report_id)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid report ID") from exc
    if not item:
        raise HTTPException(status_code=404, detail="Threat report not found")
    item["_id"] = str(item["_id"])
    if item.get("source_id"):
        source_doc = db.threat_sources.find_one({"_id": ObjectId(item["source_id"])})
        if source_doc:
            item["source_name"] = source_doc.get("source_name")
    return item


@app.post("/api/threats")
def create_threat(payload: ThreatReportPayload) -> dict:
    classified = payload.classification or classify_report(payload.title, payload.description, payload.tags)
    document = {
        "title": payload.title,
        "description": payload.description,
        "source_id": payload.source_id,
        "source_url": payload.source_url,
        "published_at": payload.published_at or "2026-01-01",
        "category": payload.category or classified.get("category", "Other"),
        "severity": payload.severity or classified.get("severity", "Medium"),
        "tags": payload.tags,
        "indicators": payload.indicators,
        "classification": {
            "method": classified.get("method", "rule_based"),
            "confidence": float(classified.get("confidence", 0.75)),
            "category": classified.get("category", "Other"),
        },
        "origin": payload.origin,
        "created_at": __import__("datetime").datetime.utcnow(),
    }
    result = db.threat_reports.insert_one(document)
    document["_id"] = str(result.inserted_id)
    return {"message": "Threat report created", "report": document}


@app.put("/api/threats/{report_id}")
def update_threat(report_id: str, payload: ThreatReportPayload) -> dict:
    try:
        existing = db.threat_reports.find_one({"_id": ObjectId(report_id)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid report ID") from exc
    if not existing:
        raise HTTPException(status_code=404, detail="Threat report not found")
    update_payload = payload.model_dump(exclude_unset=True)
    if "classification" not in update_payload or not update_payload["classification"]:
        update_payload["classification"] = classify_report(payload.title, payload.description, payload.tags)
    update_payload["updated_at"] = __import__("datetime").datetime.utcnow()
    db.threat_reports.update_one({"_id": ObjectId(report_id)}, {"$set": update_payload})
    return {"message": "Threat report updated"}


@app.delete("/api/threats/{report_id}")
def delete_threat(report_id: str) -> dict:
    try:
        result = db.threat_reports.delete_one({"_id": ObjectId(report_id)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid report ID") from exc
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Threat report not found")
    return {"message": "Threat report deleted"}


@app.get("/api/search")
def search_threats(q: str = Query(..., min_length=1)) -> dict:
    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    }
    items = list(db.threat_reports.find(query).limit(20))
    for item in items:
        item["_id"] = str(item["_id"])
    return {"query": q, "items": items}


@app.post("/api/classify")
def classify_threat(payload: dict) -> dict:
    title = payload.get("title", "")
    description = payload.get("description", "")
    tags = payload.get("tags", [])
    if not title and not description:
        raise HTTPException(status_code=400, detail="A title or description is required")
    result = classify_report(title, description, tags)
    return {"classification": result}


@app.get("/api/classifications")
def get_classifications() -> dict:
    items = list(db.classifications.find({}).sort("category", 1))
    return {"items": items}


@app.put("/api/threats/{report_id}/classification")
def update_classification(report_id: str, payload: dict) -> dict:
    try:
        object_id = ObjectId(report_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid report ID") from exc

    classification = payload.get("classification", {})
    if not classification:
        raise HTTPException(status_code=400, detail="Expected a classification payload")

    result = db.threat_reports.update_one({"_id": object_id}, {"$set": {"classification": classification}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Threat report not found")
    return {"message": "Classification updated"}


@app.get("/api/sources")
def get_sources() -> dict:
    items = list(db.threat_sources.find({}))
    for item in items:
        item["_id"] = str(item["_id"])
        item["import_count"] = db.threat_reports.count_documents({"source_id": str(item["_id"])})
    return {"items": items}


@app.post("/api/sources/import")
def import_sources() -> dict:
    source_data = [
        {
            "source_name": "CTI Digest",
            "source_url": "https://ctidigest.com/",
            "source_type": "newsletter",
            "last_updated": __import__("datetime").datetime.utcnow(),
            "status": "ready",
        },
        {
            "source_name": "Awesome Annual Security Reports",
            "source_url": "https://github.com/jacobdjwilson/awesome-annual-security-reports/",
            "source_type": "repository",
            "last_updated": __import__("datetime").datetime.utcnow(),
            "status": "ready",
        },
    ]
    inserted = 0
    for source in source_data:
        existing = db.threat_sources.find_one({"source_name": source["source_name"]})
        if existing:
            continue
        db.threat_sources.insert_one(source)
        inserted += 1
    return {"message": "Sources imported", "count": inserted}


@app.get("/api/analytics/overview")
def dashboard_overview() -> dict:
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    categories = list(db.threat_reports.aggregate(pipeline))
    severity_pipeline = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    severities = list(db.threat_reports.aggregate(severity_pipeline))
    by_day = list(db.threat_reports.aggregate([
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$published_at"}}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]))
    top_sources = list(db.threat_reports.aggregate([
        {"$group": {"_id": "$source_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]))
    return {"categories": categories, "severity": severities, "timeline": by_day, "top_sources": top_sources}


@app.get("/api/analytics/categories")
def categories_stats() -> list:
    return list(db.threat_reports.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))


@app.get("/api/analytics/severity")
def severity_stats() -> list:
    return list(db.threat_reports.aggregate([
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))


@app.get("/api/analytics/timeline")
def timeline_stats() -> list:
    return list(db.threat_reports.aggregate([
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$published_at"}}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]))


@app.get("/api/database/stats")
def database_stats() -> dict:
    return get_database_stats()


@app.get("/api/database/cache")
def cache_stats() -> dict:
    status = db.command("serverStatus")
    cache = status.get("wiredTiger", {}).get("cache", {})
    return {
        "status": "ok",
        "cache_bytes": cache.get("bytes currently in the cache", 0),
        "tracked_dirty_bytes": cache.get("tracked dirty bytes in the cache", 0),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(BACKEND_PORT), reload=True)
