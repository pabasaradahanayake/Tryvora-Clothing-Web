"""
app/services/size_recommender.py
─────────────────────────────────
Rule-based size recommendation from body measurements.
Category-specific charts for better accuracy per garment type.
"""

from __future__ import annotations

# ── Size charts ───────────────────────────────────────────────────────────────
# Format: list of (max_chest_cm, size_label) — first bracket that fits is used.
# Based on standard Asian/international garment sizing (S/M/L/XL).

_CHEST_CHART: dict[str, list[tuple[float, str]]] = {
    "shirt":  [(84, "XS"), (92, "S"), (100, "M"), (108, "L"), (116, "XL"), (float("inf"), "XXL")],
    "tshirt": [(84, "XS"), (92, "S"), (100, "M"), (108, "L"), (116, "XL"), (float("inf"), "XXL")],
    "dress":  [(80, "XS"), (88, "S"), (96,  "M"), (104, "L"), (112, "XL"), (float("inf"), "XXL")],
}

# Pants/jeans use hip width (not chest) as the primary measure
_HIP_CHART: dict[str, list[tuple[float, str]]] = {
    "pants":  [(82, "XS"), (88, "S"), (94, "M"), (100, "L"), (108, "XL"), (float("inf"), "XXL")],
    "skirts":  [(82, "XS"), (88, "S"), (94, "M"), (100, "L"), (108, "XL"), (float("inf"), "XXL")],
}


def recommend_size(
    category: str,
    chest_cm: float | None,
    hip_cm: float | None = None,
) -> dict:
    """
    Return a size recommendation for the given category.

    Returns:
        {
            "size": str,            # "XS" | "S" | "M" | "L" | "XL" | "XXL"
            "basis": str,           # measurement used ("chest" | "hip")
            "measurement_cm": float | None
        }
    """
    cat = category.lower()

    # ── Pants: use hip width ──────────────────────────────────────────────────
    if cat in _HIP_CHART:
        chart  = _HIP_CHART[cat]
        value  = hip_cm
        basis  = "hip"
        if value is None:
            return {"size": "Unknown", "basis": basis, "measurement_cm": None,
                    "note": "Hip measurement unavailable."}
    # ── All other categories: use chest ───────────────────────────────────────
    elif cat in _CHEST_CHART:
        chart  = _CHEST_CHART[cat]
        value  = chest_cm
        basis  = "chest"
        if value is None:
            return {"size": "Unknown", "basis": basis, "measurement_cm": None,
                    "note": "Chest measurement unavailable."}
    else:
        return {"size": "Unknown", "basis": "n/a", "measurement_cm": None,
                "note": f"Unknown category: {category}"}

    # ── Look up size ──────────────────────────────────────────────────────────
    size = "XXL"               # default fallback
    for max_val, label in chart:
        if value <= max_val:
            size = label
            break

    return {
        "size": size,
        "basis": basis,
        "measurement_cm": round(value, 1),
    }
