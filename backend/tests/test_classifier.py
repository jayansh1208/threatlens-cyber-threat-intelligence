import os

from app.config import get_list_setting
from app.services.classifier import classify_report


def test_classify_report_detects_ransomware() -> None:
    result = classify_report(
        "Ransomware operators stole backup keys and encrypted the network",
        "A ransomware gang demanded payment after stealing credential material and encrypting systems.",
        ["ransomware", "extortion", "credential theft"],
    )

    assert result["category"] == "Ransomware"
    assert result["severity"] == "Critical"
    assert 0.5 <= result["confidence"] <= 1.0


def test_list_setting_parses_csv_values(monkeypatch) -> None:
    monkeypatch.setenv("FRONTEND_ORIGINS", "https://app.vercel.app,https://admin.vercel.app")
    values = get_list_setting("FRONTEND_ORIGINS")
    assert values == ["https://app.vercel.app", "https://admin.vercel.app"]
