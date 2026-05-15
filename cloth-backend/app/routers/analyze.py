"""
app/routers/analyze.py
API4AI Virtual Try-On integrated endpoint.
Any logged frontend user can generate try-on.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query

from app.core.security import get_current_user_dep
from app.schemas.token import TokenData
from app.services.overlay import cached_clothing, get_clothing_by_id, generate_overlay
from app.services.pose import get_pose_estimator
from app.services.pose import draw_8pt_skeleton, draw_full_skeleton
from app.services.size_recommender import recommend_size

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = PROJECT_ROOT / "static"
OUTPUT_DIR = STATIC_DIR / "output"

router = APIRouter(prefix="/analyze", tags=["Virtual Try-On"])

CurrentUser = Annotated[TokenData, Depends(get_current_user_dep)]

MAX_FILE_BYTES = 10 * 1024 * 1024

MEASUREMENT_NOTE = (
    "Body measurements are approximate estimates (±5 cm). "
    "For best accuracy, upload a clear full-body image."
)


@router.get(
    "/clothing-options",
    summary="List available clothing PNGs for frontend selection",
)
async def get_clothes(
    sex: str | None = Query(None),
    category: str | None = Query(None),
    clothing_type: str | None = Query(None),
):
    # Clear cache so newly uploaded clothes from admin dashboard are included
    cached_clothing.cache_clear()
    items = cached_clothing()

    if sex:
        items = [i for i in items if i["sex"] == sex]

    if category:
        items = [i for i in items if i["category"] == category]

    if clothing_type:
        items = [i for i in items if i["type"] == clothing_type]

    return {"cloths": items}


@router.post("/refresh-cache", summary="Clear the clothing list cache")
async def refresh_clothing_cache(current_user: CurrentUser):
    cached_clothing.cache_clear()
    return {"message": "Clothing cache cleared successfully. Any new files will now be visible."}


@router.post(
    "",
    summary="Generate virtual try-on result",
)
async def analyze(
    file: UploadFile = File(..., description="User photo"),
    real_height_cm: float | None = Form(default=None, ge=100, le=250),
    clothing_id: int | None = Form(default=None),
    debug_skeleton: bool = Form(default=False),
):
    content_type = file.content_type or ""

    if content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, or WebP images are accepted.",
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds 10 MB limit.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file received.",
        )

    selected_item = None

    if clothing_id is not None:
        selected_item = get_clothing_by_id(clothing_id)

        if not selected_item:
            cached_clothing.cache_clear()
            selected_item = get_clothing_by_id(clothing_id)

    if not selected_item:
        raise HTTPException(
            status_code=400,
            detail="Please select a valid clothing item.",
        )

    estimator = get_pose_estimator()
    measurements = estimator.estimate(image_bytes, real_height_cm=real_height_cm)

    category = selected_item.get("type") or selected_item.get("category") or "clothing"
    confidence = 1.0

    size_result: dict = {"size": None, "basis": None}

    if measurements.landmarks_found:
        size_result = recommend_size(
            category=category,
            chest_cm=measurements.chest_estimate_cm,
            hip_cm=measurements.hip_width_cm,
        )

    preview_url: str | None = None
    skeleton_debug_url: str | None = None

    if debug_skeleton and measurements.landmarks_found and measurements.landmarks_px:
        skel_bytes = draw_8pt_skeleton(image_bytes, measurements.landmarks_px)

        if skel_bytes:
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            out_name = f"skeleton_{uuid.uuid4().hex[:12]}.png"
            (OUTPUT_DIR / out_name).write_bytes(skel_bytes)
            skeleton_debug_url = f"/static/output/{out_name}"

    else:
        try:
            preview_url = generate_overlay(
                image_bytes=image_bytes,
                selected_item=selected_item,
                shoulder_width_px=measurements.shoulder_width_px,
                shoulder_mid_x=measurements.shoulder_mid_x_px,
                shoulder_mid_y=measurements.shoulder_mid_y_px,
                landmarks_found=measurements.landmarks_found,
                landmarks_px=measurements.landmarks_px,
            )

            if not preview_url:
                raise HTTPException(
                    status_code=500,
                    detail="Try-on failed. No preview image was generated.",
                )

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Try-on failed: {exc}",
            )

    return {
        "category": category,
        "confidence": confidence,
        "low_confidence": False,
        "all_scores": {},

        "landmarks_found": measurements.landmarks_found,
        "shoulder_width_cm": measurements.shoulder_width_cm,
        "chest_estimate_cm": measurements.chest_estimate_cm,
        "waist_estimate_cm": measurements.waist_estimate_cm,
        "hip_width_cm": measurements.hip_width_cm,

        "recommended_size": size_result["size"],
        "size_basis": size_result["basis"],

        "selected_clothing": selected_item,
        "preview_image_url": preview_url,
        "skeleton_debug_url": skeleton_debug_url,

        "measurement_note": MEASUREMENT_NOTE,
        "pose_note": measurements.note,
    }


@router.post(
    "/skeleton",
    summary="Draw all 33 BlazePose landmarks on the uploaded image",
)
async def skeleton_debug_endpoint(
    file: UploadFile = File(..., description="User photo"),
):
    content_type = file.content_type or ""

    if content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted.")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    estimator = get_pose_estimator()

    import io as _io
    import mediapipe as mp
    import numpy as np
    from PIL import Image as _Image

    pil_img = _Image.open(_io.BytesIO(image_bytes)).convert("RGB")
    rgb_array = np.array(pil_img, dtype=np.uint8)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)
    detection = estimator._landmarker.detect(mp_image)

    if not detection.pose_landmarks or len(detection.pose_landmarks) == 0:
        return {"skeleton_url": None, "note": "No body pose detected in this image."}

    all_landmarks = detection.pose_landmarks[0]

    skel_bytes = draw_full_skeleton(image_bytes, all_landmarks)

    if not skel_bytes:
        raise HTTPException(status_code=500, detail="Failed to render skeleton image.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_name = f"skeleton33_{uuid.uuid4().hex[:12]}.png"
    (OUTPUT_DIR / out_name).write_bytes(skel_bytes)

    return {
        "skeleton_url": f"/static/output/{out_name}",
        "landmarks_count": len([lm for lm in all_landmarks if lm.visibility > 0.3]),
        "note": "Point numbers match MediaPipe BlazePose indices (0-32).",
    }