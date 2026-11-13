"""ThreatLens Lab 7.1: Production schema analysis.

This script demonstrates why embedded fields are valid only for bounded data,
while unbounded threat indicators and report metadata should be referenced.
"""

from __future__ import annotations

import json
import os
import sys
from statistics import mean
from time import perf_counter

from bson import ObjectId
from pymongo import MongoClient

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "threatlens")


def reset_collection(db, name: str):
    if name in db.list_collection_names():
        db[name].drop()
    return db[name]


def measure_bson_size(doc: dict) -> int:
    return len(bson.BSON.encode(doc))


if __name__ == "__main__":
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client[DB_NAME]
    ref_reports = reset_collection(db, "ref_schema_reports")
    ref_indicators = reset_collection(db, "ref_schema_indicators")
    embed_reports = reset_collection(db, "embed_schema_reports")

    from bson import BSON

    print("\n[1] Referenced design")
    report_ids = []
    for idx in range(1, 6):
        report_id = ObjectId()
        report_ids.append(report_id)
        ref_reports.insert_one({
            "_id": report_id,
            "title": f"Threat report {idx}",
            "category": "Malware",
            "severity": "High",
            "source": "CTI Digest",
        })
        ref_indicators.insert_many([
            {"report_id": report_id, "indicator": f"hash-{idx}-1", "type": "sha256"},
            {"report_id": report_id, "indicator": f"domain-{idx}-1", "type": "domain"},
            {"report_id": report_id, "indicator": f"ip-{idx}-1", "type": "ip"},
        ])

    sample_doc = ref_reports.find_one({"title": "Threat report 1"})
    indicators = list(ref_indicators.find({"report_id": sample_doc["_id"]}))
    print(f"Referenced report size: {len(BSON.encode(sample_doc))} bytes")
    print(f"Indicators for this report: {len(indicators)}")

    print("\n[2] Embedded design")
    for idx in range(1, 6):
        embedded = {
            "title": f"Embedded threat report {idx}",
            "category": "Malware",
            "severity": "High",
            "source": "CTI Digest",
            "indicators": [
                {"indicator": f"hash-{idx}-1", "type": "sha256"},
                {"indicator": f"domain-{idx}-1", "type": "domain"},
                {"indicator": f"ip-{idx}-1", "type": "ip"},
            ],
        }
        embed_reports.insert_one(embedded)

    print("\n[3] BSON size comparison")
    pipeline = [{"$project": {"title": 1, "doc_size": {"$bsonSize": "$$ROOT"}}}]
    ref_sizes = [doc["doc_size"] for doc in ref_reports.aggregate(pipeline)]
    embed_sizes = [doc["doc_size"] for doc in embed_reports.aggregate(pipeline)]

    print(f"Referenced average BSON size: {mean(ref_sizes):.0f} bytes")
    print(f"Embedded average BSON size: {mean(embed_sizes):.0f} bytes")
    print(f"Referenced min/max: {min(ref_sizes)} / {max(ref_sizes)} bytes")
    print(f"Embedded min/max: {min(embed_sizes)} / {max(embed_sizes)} bytes")

    limit = 16 * 1024 * 1024
    print(f"MongoDB 16 MiB limit: {limit:,} bytes")

    print("\n[4] Query comparison")
    start = perf_counter()
    for _ in range(500):
        list(ref_reports.find({"category": "Malware"}))
        list(ref_indicators.find({"report_id": sample_doc["_id"]}))
    ref_elapsed = perf_counter() - start

    start = perf_counter()
    for _ in range(500):
        list(embed_reports.find({"category": "Malware"}))
    embed_elapsed = perf_counter() - start

    print(f"Referenced query workload: {ref_elapsed:.3f}s")
    print(f"Embedded query workload: {embed_elapsed:.3f}s")

    print("\n[5] Recommendation")
    print("- Use references for unbounded indicator sets or multi-entity relationships.")
    print("- Embed small bounded metadata, such as a report summary or a few short tags.")
    print("- Avoid embedding unbounded IOC lists inside a threat report document.")
    print("- Use indexes on category, severity, source_id, and published_at.")

    print("\nLab 7.1 complete.")
