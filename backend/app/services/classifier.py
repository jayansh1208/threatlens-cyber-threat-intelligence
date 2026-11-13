from __future__ import annotations

import re
from typing import Any


CATEGORY_KEYWORDS = {
    "Malware": ["malware", "trojan", "keylogger", "loader", "dropper", "backdoor"],
    "Ransomware": ["ransomware", "encryptor", "locker", "extortion"],
    "Phishing": ["phishing", "credential theft", "fake login", "spoofed email", "sms phishing"],
    "Vulnerability": ["cve", "zero-day", "vulnerability", "patch", "exploit", "security advisory"],
    "Data Breach": ["breach", "leak", "credential leak", "database leak", "exposed records"],
    "Advanced Persistent Threat": ["apt", "targeted campaign", "state-sponsored", "spear phishing"],
    "Botnet": ["botnet", "ddos", "mirai", "zombie network"],
    "Other": ["threat", "campaign", "incident", "report"],
}

SEVERITY_RULES = {
    "Critical": ["ransomware", "active exploitation", "zero-day", "critical", "mass breach"],
    "High": ["malware", "phishing", "apt", "botnet", "data breach", "exploit"],
    "Medium": ["credential theft", "vulnerability", "malicious domain", "campaign"],
    "Low": ["indicator", "scan", "observed", "warning"],
    "Informational": ["newsletter", "summary", "analysis"],
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip().lower()


def classify_report(title: str, description: str, tags: list[str] | None = None) -> dict[str, Any]:
    text = normalize_text(f"{title} {description} {' '.join(tags or [])}")
    best_category = "Other"
    best_category_score = -1

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > best_category_score:
            best_category_score = score
            best_category = category

    severity = "Informational"
    highest_score = -1
    for level, keywords in SEVERITY_RULES.items():
        score = sum(1 for keyword in keywords if keyword in text)
        if score > highest_score:
            highest_score = score
            severity = level

    confidence = min(0.98, max(0.55, 0.62 + (best_category_score * 0.08) + (highest_score * 0.05)))
    return {
        "method": "rule_based",
        "category": best_category,
        "severity": severity,
        "confidence": round(confidence, 2),
    }
