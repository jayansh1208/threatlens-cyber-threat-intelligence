"""ThreatLens embedded-vs-referenced demo.

This script demonstrates the operational trade-off between embedding a limited
set of indicator metadata into a report vs. storing those indicators in a
separate collection and linking via ObjectIds.
"""

from __future__ import annotations

import os
import sys
import time

from bson import ObjectId
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "threatlens")


def main() -> None:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client[DB_NAME]
    db.reference_reports.drop()
    db.reference_indicators.drop()
    db.embedded_reports.drop()

    report_id = ObjectId()
    db.reference_reports.insert_one({
        "_id": report_id,
        "title": "Referenced IOC Example",
        "category": "Malware",
        "severity": "High",
    })
    db.reference_indicators.insert_many([
        {"report_id": report_id, "indicator": "hash-1", "type": "sha256"},
        {"report_id": report_id, "indicator": "domain-1", "type": "domain"},
        {"report_id": report_id, "indicator": "ip-1", "type": "ip"},
    ])

    db.embedded_reports.insert_one({
        "title": "Embedded IOC Example",
        "category": "Malware",
        "severity": "High",
        "indicators": [
            {"indicator": "hash-1", "type": "sha256"},
            {"indicator": "domain-1", "type": "domain"},
            {"indicator": "ip-1", "type": "ip"},
        ],
    })

    start = time.perf_counter()
    for _ in range(500):
        report = db.reference_reports.find_one({"_id": report_id})
        indicators = list(db.reference_indicators.find({"report_id": report["_id"]}))
    ref_elapsed = time.perf_counter() - start

    start = time.perf_counter()
    for _ in range(500):
        report = db.embedded_reports.find_one({"title": "Embedded IOC Example"})
        indicators = report.get("indicators", [])
    embedded_elapsed = time.perf_counter() - start

    print("Referenced design: two queries, cheaper writes, easier growth control")
    print(f"Referenced workload: {ref_elapsed:.3f}s")
    print("Embedded design: single document read, faster reads for small bounded data")
    print(f"Embedded workload: {embedded_elapsed:.3f}s")
    print("Trade-off: embedded documents are faster for small data but harder to scale and update.")


if __name__ == "__main__":
    main()
