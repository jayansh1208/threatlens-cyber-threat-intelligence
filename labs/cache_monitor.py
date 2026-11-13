"""ThreatLens cache monitor.

Runs every 10 seconds, prints serverStatus cache counters and checks for new
threat reports in the threatlens database.
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime

from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "threatlens")


def format_cache(cache):
    return {
        "max": cache.get("maximum bytes configured", 0),
        "in_cache": cache.get("bytes currently in the cache", 0),
        "dirty": cache.get("tracked dirty bytes in the cache", 0),
        "pages_read": cache.get("pages read into cache", 0),
        "pages_evicted": cache.get("eviction pages evicted by application threads", 0),
    }


def main() -> None:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client[DB_NAME]
    seen_ids = set()

    try:
        while True:
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            status = db.command("serverStatus")
            cache = status.get("wiredTiger", {}).get("cache", {})
            print(f"\n[{timestamp}] WiredTiger cache metrics")
            print(format_cache(cache))

            latest = list(db.threat_reports.find({}, {"_id": 1, "title": 1, "published_at": 1}).sort("published_at", -1).limit(10))
            new_reports = [r for r in latest if str(r["_id"]) not in seen_ids]
            if new_reports:
                print("New threat reports detected:")
                for report in new_reports:
                    print(f" - {report.get('title')} ({report.get('published_at')})")
                    seen_ids.add(str(report["_id"]))
            else:
                print("No new reports detected in the last poll cycle.")
            time.sleep(10)
    except KeyboardInterrupt:
        print("\nCache monitor stopped cleanly.")


if __name__ == "__main__":
    main()
