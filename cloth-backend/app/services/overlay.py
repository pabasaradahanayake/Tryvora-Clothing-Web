"""
app/services/overlay.py
API4AI Virtual Try-On + clothing list helper.
"""

from __future__ import annotations

import base64
import os
import uuid
from functools import lru_cache
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent.parent
CLOTHING_DIR = ROOT / "static" / "clothing_pngs"
OUTPUT_DIR = ROOT / "static" / "output"

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")
API_URL = f"https://{RAPIDAPI_HOST}/results"

SEXES = {"male", "female"}
CATEGORIES = {"upper_body", "lower_body", "full_body"}


def parse_path(path: Path):
    sex = None
    category = None
    clothing_type = None

    for part in path.parts:
        if part in SEXES:
            sex = part
        elif part in CATEGORIES:
            category = part
        else:
            clothing_type = part

    return sex, category, clothing_type


def list_available_clothing():
    items = []
    idx = 1

    for path in CLOTHING_DIR.rglob("*.png"):
        if not path.is_file():
            continue

        p_sex, p_category, p_type = parse_path(path.parent)

        if not p_type:
            continue

        name = path.stem

        items.append({
            "id": idx,
            "key": f"{p_sex}|{p_type}|{name}",
            "sex": p_sex,
            "type": p_type,
            "category": p_category,
            "name": name.replace("-", " ").title(),
            "image_url": f"/static/clothing_pngs/{path.relative_to(CLOTHING_DIR).as_posix()}",
        })

        idx += 1

    return items


@lru_cache()
def cached_clothing():
    return list_available_clothing()


def get_clothing_by_id(clothing_id: int):
    for item in cached_clothing():
        if item["id"] == clothing_id:
            return item
    return None


def generate_overlay(
    image_bytes: bytes,
    selected_item: dict,
    *,
    shoulder_width_px: float = 0,
    shoulder_mid_x: float = 0,
    shoulder_mid_y: float = 0,
    landmarks_found: bool = False,
    landmarks_px=None,
) -> str | None:
    """
    Generate virtual try-on result using API4AI.
    Local OpenCV overlay is disabled.
    """

    if not RAPIDAPI_KEY or not RAPIDAPI_HOST:
        print("API4AI ERROR: RAPIDAPI_KEY or RAPIDAPI_HOST missing")
        return None

    relative_path = selected_item["image_url"].replace("/static/clothing_pngs/", "")
    clothing_path = CLOTHING_DIR / relative_path

    if not clothing_path.exists():
        print("API4AI ERROR: clothing file not found")
        return None

    try:
        apparel_bytes = clothing_path.read_bytes()

        files = {
            "image": ("person.png", image_bytes, "image/png"),
            "image-apparel": ("apparel.png", apparel_bytes, "image/png"),
        }

        headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
        }

        response = requests.post(
            API_URL,
            headers=headers,
            files=files,
            timeout=120,
        )

        if response.status_code != 200:
            print("API4AI ERROR:", response.text)
            return None

        result = response.json()

        base64_img = result["results"][0]["entities"][0]["image"]
        output_bytes = base64.b64decode(base64_img)

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        out_name = f"tryon_{uuid.uuid4().hex[:12]}.png"
        out_path = OUTPUT_DIR / out_name
        out_path.write_bytes(output_bytes)

        return f"/static/output/{out_name}"

    except Exception as e:
        print("API4AI TRY-ON ERROR:", e)
        return None