#!/usr/bin/env python3
"""Analyse rapide des donnees Triweb depuis un fichier JSON ou une URL API."""

from __future__ import annotations

import json
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


def normalize_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "data", "result", "results", "value", "records"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def load_source(source: str) -> list[dict[str, Any]]:
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source, timeout=20) as response:  # nosec - outil local de diagnostic
            return normalize_rows(json.loads(response.read().decode("utf-8")))

    path = Path(source)
    with path.open("r", encoding="utf-8") as handle:
        return normalize_rows(json.load(handle))


def duration_to_hours(value: str | None) -> float:
    if not value or value == "00:00:00":
        return 0.0
    try:
        h, m, s = [int(part) for part in value.split(":")]
        return round(h + m / 60 + s / 3600, 2)
    except Exception:
        return 0.0


def main() -> int:
    source = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000/api/dashboard/items"
    rows = load_source(source)

    by_status = Counter(row.get("statut") or "Non renseigne" for row in rows)
    by_position = Counter(row.get("postion") or row.get("position") or "Non renseignee" for row in rows)
    by_nature = Counter(row.get("nature") or "Non renseignee" for row in rows)
    by_team = Counter((row.get("teamG") or row.get("teamR") or "Non affecte").strip() for row in rows)
    by_month: dict[str, int] = defaultdict(int)
    total_hours = 0.0

    for row in rows:
        year = row.get("annee") or datetime.now().year
        month = row.get("mois") or "??"
        by_month[f"{year}-{str(month).zfill(2)}"] += 1
        total_hours += duration_to_hours(row.get("dureeR"))
        total_hours += duration_to_hours(row.get("dureeG"))
        total_hours += duration_to_hours(row.get("dureeCqi"))
        total_hours += duration_to_hours(row.get("dureeCqc"))

    print("=== Synthese Triweb ===")
    print(f"Dossiers: {len(rows)}")
    print(f"Charge mesuree: {round(total_hours, 2)} h")
    print("\nTop statuts:")
    for label, value in by_status.most_common(8):
        print(f"- {label}: {value}")
    print("\nTop positions:")
    for label, value in by_position.most_common(8):
        print(f"- {label}: {value}")
    print("\nTop natures:")
    for label, value in by_nature.most_common(8):
        print(f"- {label}: {value}")
    print("\nTop equipes:")
    for label, value in by_team.most_common(8):
        print(f"- {label}: {value}")
    print("\nEvolution mensuelle:")
    for label in sorted(by_month):
        print(f"- {label}: {by_month[label]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
