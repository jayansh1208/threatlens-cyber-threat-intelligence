"""ThreatLens Lab 7.2: Working set analysis.

This script inserts 100,000 threat-like documents to explore WiredTiger cache
behavior, document sizing, and working-set estimation.
"""

from __future__ import annotations

import os
import sys
import time

from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "threatlens")


def main() -> None:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client[DB_NAME]
    collection = db["working_set_docs"]
    collection.drop()

    print("Inserting 100,000 threat indicator documents (~2 KB each)...")
    batch_size = 5000
    total = 100_000
    payload = [{
        "sensor_id": f"sensor-{idx:06d}",
        "report_category": "Ransomware" if idx % 2 == 0 else "Malware",
        "severity": "High" if idx % 3 == 0 else "Medium",
        "metadata": "x" * 1800,
        "source": "synthetic-demo",
        "timestamp": "2026-11-13T00:00:00Z",
    } for idx in range(total)]

    start = time.perf_counter()
    for i in range(0, len(payload), batch_size):
        collection.insert_many(payload[i:i + batch_size])
    elapsed = time.perf_counter() - start
    print(f"Inserted {total:,} docs in {elapsed:.2f}s ({total / elapsed:,.0f} docs/sec)")

    status = db.command("serverStatus")
    cache = status.get("wiredTiger", {}).get("cache", {})
    print("\n=== WiredTiger cache overview ===")
    print(f"Cache max configured: {cache.get('maximum bytes configured', 0):,} bytes")
    print(f"Bytes currently in cache: {cache.get('bytes currently in the cache', 0):,} bytes")
    print(f"Tracked dirty bytes: {cache.get('tracked dirty bytes in the cache', 0):,} bytes")
    print(f"Pages read into cache: {cache.get('pages read into cache', 0):,}")
    print(f"Pages evicted by app threads: {cache.get('eviction pages evicted by application threads', 0):,}")

    ranges = [(0, 1000), (49_000, 50_000), (99_000, 100_000)]
    print("\n=== Range-read workload ===")
    for start_idx, end_idx in ranges:
        a = f"sensor-{start_idx:06d}"
        b = f"sensor-{end_idx:06d}"
        t0 = time.perf_counter()
        results = list(collection.find({"sensor_id": {"$gte": a, "$lte": b}}))
        elapsed = time.perf_counter() - t0
        print(f"Range {start_idx:>6}-{end_idx:<6} -> {elapsed * 1000:.1f} ms, docs={len(results)}")

    status_after = db.command("serverStatus")
    cache_after = status_after.get("wiredTiger", {}).get("cache", {})
    pages_read = cache_after.get("pages read into cache", 0)
    evictions = cache_after.get("eviction pages evicted by application threads", 0)
    print(f"\nPages read into cache: {pages_read:,}")
    print(f"Pages evicted: {evictions:,}")
    print("[Important] Cache hit ratio is not inferred as 1 - evictions/pages_read.")
    print("WiredTiger cache counters measure page cache residency and eviction behavior,")
    print("not a direct application-level cache hit ratio.")

    print("\nLab 7.2 complete.")


if __name__ == "__main__":
    main()
