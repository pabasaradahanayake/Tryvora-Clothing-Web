"""
app/services/pose.py
────────────────────
MediaPipe Pose Landmarker (Tasks API — mediapipe 0.10.9+)
Uses the new Tasks API with a downloaded .task model bundle.

Required model file (download once and place in model/):
  model/pose_landmarker_full.task
  Download: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task

Key landmarks used (same 33-point BlazePose skeleton):
  LEFT_SHOULDER  (11)   RIGHT_SHOULDER (12)
  LEFT_HIP       (23)   RIGHT_HIP      (24)
  LEFT_ANKLE     (27)   RIGHT_ANKLE    (28)

Measurements are APPROXIMATE.
Providing real_height_cm significantly improves accuracy.
"""

from __future__ import annotations

import math
import io
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import cv2

# ── Model path ────────────────────────────────────────────────────────────────
MODEL_PATH = (
    Path(__file__).resolve().parent.parent.parent / "model" / "pose_landmarker_full.task"
)

# Landmark indices in the BlazePose 33-point skeleton
# https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
_LM = {
    "LEFT_SHOULDER":  11,
    "RIGHT_SHOULDER": 12,
    "LEFT_HIP":       23,
    "RIGHT_HIP":      24,
    "LEFT_KNEE":      25,
    "RIGHT_KNEE":     26,
    "LEFT_ANKLE":     27,
    "RIGHT_ANKLE":    28,
}


@dataclass
class BodyMeasurements:
    shoulder_width_cm: float | None = None
    chest_estimate_cm: float | None = None
    waist_estimate_cm: float | None = None
    hip_width_cm: float | None      = None
    torso_height_cm: float | None   = None
    shoulder_width_px: float        = 0.0
    shoulder_mid_x_px: float        = 0.0   # for overlay alignment
    shoulder_mid_y_px: float        = 0.0
    landmarks_px: dict[str, tuple[float, float]] = field(default_factory=dict)
    landmarks_found: bool           = False
    note: str                       = ""


class PoseEstimator:
    """Wrapper around MediaPipe Pose Landmarker (Tasks API) for body measurements."""

    def __init__(self) -> None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"MediaPipe model not found at {MODEL_PATH}\n"
                "Download it from:\n"
                "  https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
                "pose_landmarker_full/float16/latest/pose_landmarker_full.task\n"
                "and place it in the  model/  directory."
            )

        base_options = mp_python.BaseOptions(model_asset_path=str(MODEL_PATH))
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = mp_vision.PoseLandmarker.create_from_options(options)
        print("[PoseEstimator] MediaPipe Pose Landmarker initialized")

    # ── Public API ────────────────────────────────────────────────────────────

    def estimate(self, image_bytes: bytes, real_height_cm: float | None = None) -> BodyMeasurements:
        """
        Detect pose from raw image bytes and compute body measurements.

        Args:
            image_bytes:     Raw uploaded image data.
            real_height_cm:  Optional actual user height in cm.

        Returns:
            BodyMeasurements dataclass.
        """
        result = BodyMeasurements()

        # ── Decode image ──────────────────────────────────────────────────────
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            result.note = f"Image decode error: {exc}"
            return result

        img_w, img_h = pil_img.size

        # Convert to MediaPipe Image (Tasks API uses mp.Image, not numpy directly)
        rgb_array = np.array(pil_img, dtype=np.uint8)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)

        # ── Run Pose Landmarker ───────────────────────────────────────────────
        detection = self._landmarker.detect(mp_image)

        if not detection.pose_landmarks or len(detection.pose_landmarks) == 0:
            result.note = "No body pose detected in this image."
            return result

        result.landmarks_found = True

        # Use the first detected pose (num_poses=1)
        landmarks = detection.pose_landmarks[0]   # list of NormalizedLandmark

        def px(idx: int) -> tuple[float, float]:
            """Convert normalised landmark → pixel coords."""
            lm = landmarks[idx]
            return lm.x * img_w, lm.y * img_h

        # ── Extract key points ─────────────────────────────────────────────
        result.landmarks_px = {}
        for name, idx in _LM.items():
            lm = landmarks[idx]
            # Tasks API poses have presence/visibility, but we check visibility to be safe if occluded
            if lm.visibility > 0.5:
                result.landmarks_px[name] = (lm.x * img_w, lm.y * img_h)

        ls_x, ls_y = px(_LM["LEFT_SHOULDER"])
        rs_x, rs_y = px(_LM["RIGHT_SHOULDER"])
        lh_x, lh_y = px(_LM["LEFT_HIP"])
        rh_x, rh_y = px(_LM["RIGHT_HIP"])
        la_x, la_y = px(_LM["LEFT_ANKLE"])
        ra_x, ra_y = px(_LM["RIGHT_ANKLE"])

        # ── Pixel distances ────────────────────────────────────────────────
        shoulder_px  = _dist(ls_x, ls_y, rs_x, rs_y)
        hip_px       = _dist(lh_x, lh_y, rh_x, rh_y)
        torso_px     = _dist(
            (ls_x + rs_x) / 2, (ls_y + rs_y) / 2,
            (lh_x + rh_x) / 2, (lh_y + rh_y) / 2,
        )
        full_body_px = _dist(
            (ls_x + rs_x) / 2, min(ls_y, rs_y),
            (la_x + ra_x) / 2, max(la_y, ra_y),
        )

        # Shoulder midpoint for 2D overlay alignment
        result.shoulder_width_px  = shoulder_px
        result.shoulder_mid_x_px  = (ls_x + rs_x) / 2
        result.shoulder_mid_y_px  = (ls_y + rs_y) / 2

        # ── px → cm conversion ─────────────────────────────────────────────
        if real_height_cm and full_body_px > 0:
            px_per_cm  = full_body_px / real_height_cm
            scale_note = f"Using provided height ({real_height_cm} cm) for pixel→cm scale."
        elif img_h > 0:
            # Fallback: assume full image height ≈ 170 cm reference
            px_per_cm  = img_h / 170.0
            scale_note = "No height provided — estimates based on 170 cm reference (±10 cm error)."
        else:
            result.note = "Cannot compute scale factor."
            return result

        # ── Final measurements ─────────────────────────────────────────────
        # Chest ≈ shoulder_width × 2.1   (standard tailoring ratio)
        # Waist ≈ hip_px × 1.9
        result.shoulder_width_cm = round(shoulder_px / px_per_cm, 1)
        result.chest_estimate_cm = round((shoulder_px * 2.1) / px_per_cm, 1)
        result.waist_estimate_cm = round((hip_px * 1.9) / px_per_cm, 1)
        result.hip_width_cm      = round(hip_px / px_per_cm, 1)
        result.torso_height_cm   = round(torso_px / px_per_cm, 1)
        result.note              = scale_note

        return result

    def close(self) -> None:
        self._landmarker.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _dist(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


# ── Skeleton Drawing ─────────────────────────────────────────────────────────

# Connections between the 8 measurement landmarks
_8PT_CONNECTIONS: list[tuple[str, str]] = [
    ("LEFT_SHOULDER",  "RIGHT_SHOULDER"),
    ("LEFT_SHOULDER",  "LEFT_HIP"),
    ("RIGHT_SHOULDER", "RIGHT_HIP"),
    ("LEFT_HIP",       "RIGHT_HIP"),
    ("LEFT_HIP",       "LEFT_KNEE"),
    ("RIGHT_HIP",      "RIGHT_KNEE"),
    ("LEFT_KNEE",      "LEFT_ANKLE"),
    ("RIGHT_KNEE",     "RIGHT_ANKLE"),
]

# Full BlazePose 33-point connection topology (index pairs)
_FULL_CONNECTIONS: list[tuple[int, int]] = [
    # Face
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    # Upper body
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24),
    # Lower body
    (23, 24), (23, 25), (24, 26),
    (25, 27), (26, 28),
    (27, 29), (28, 30),
    (29, 31), (30, 32),
    (27, 31), (28, 32),
]

# Zone colors (BGR for OpenCV)
_FACE_COLOR   = (255, 200, 0)    # Blue-ish
_UPPER_COLOR  = (0, 220, 0)      # Green
_LOWER_COLOR  = (0, 80, 255)     # Red
_LINE_COLOR   = (200, 200, 200)  # Light grey
_LABEL_COLOR  = (255, 255, 255)  # White

def _point_zone_color(idx: int):
    if idx <= 10:
        return _FACE_COLOR
    elif idx <= 22:
        return _UPPER_COLOR
    else:
        return _LOWER_COLOR


def draw_8pt_skeleton(image_bytes: bytes, landmarks_px: dict[str, tuple[float, float]]) -> bytes | None:
    """
    Draw the 8 measurement landmarks and their connections onto the image.
    Returns PNG bytes of the annotated image, or None on failure.
    """

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)[:, :, ::-1].copy()  # RGB → BGR for OpenCV
    except Exception:
        return None

    # Draw connections first (so dots appear on top)
    for (name_a, name_b) in _8PT_CONNECTIONS:
        if name_a in landmarks_px and name_b in landmarks_px:
            x1, y1 = landmarks_px[name_a]
            x2, y2 = landmarks_px[name_b]
            cv2.line(img_np, (int(x1), int(y1)), (int(x2), int(y2)), _LINE_COLOR, 2, cv2.LINE_AA)

    # Draw joints
    for name, (x, y) in landmarks_px.items():
        ix, iy = int(x), int(y)
        color = _UPPER_COLOR if "SHOULDER" in name or "HIP" in name else _LOWER_COLOR
        cv2.circle(img_np, (ix, iy), 8, color, -1, cv2.LINE_AA)
        cv2.circle(img_np, (ix, iy), 8, (255, 255, 255), 2, cv2.LINE_AA)  # white ring
        cv2.putText(img_np, name.replace("_", " "), (ix + 10, iy - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, _LABEL_COLOR, 1, cv2.LINE_AA)

    _, buf = cv2.imencode(".png", img_np)
    return bytes(buf)


def draw_full_skeleton(image_bytes: bytes, all_landmarks: list) -> bytes | None:
    """
    Draw all 33 BlazePose landmarks and their connections onto the image.
    `all_landmarks` is the raw list[NormalizedLandmark] from MediaPipe.
    Returns PNG bytes of the annotated image, or None on failure.
    """

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)[:, :, ::-1].copy()  # RGB → BGR
    except Exception:
        return None

    img_h, img_w = img_np.shape[:2]

    # Convert all 33 normalised landmarks → pixel coords
    pts = {}
    for idx, lm in enumerate(all_landmarks):
        if lm.visibility > 0.3:  # lower threshold so partial body shows more
            pts[idx] = (int(lm.x * img_w), int(lm.y * img_h))

    # Draw connections
    for (a, b) in _FULL_CONNECTIONS:
        if a in pts and b in pts:
            cv2.line(img_np, pts[a], pts[b], _LINE_COLOR, 2, cv2.LINE_AA)

    # Draw joints with zone color
    for idx, (x, y) in pts.items():
        color = _point_zone_color(idx)
        cv2.circle(img_np, (x, y), 7, color, -1, cv2.LINE_AA)
        cv2.circle(img_np, (x, y), 7, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(img_np, str(idx), (x + 8, y - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, _LABEL_COLOR, 1, cv2.LINE_AA)

    _, buf = cv2.imencode(".png", img_np)
    return bytes(buf)


# ── Module-level singleton ────────────────────────────────────────────────────
_estimator: PoseEstimator | None = None


def get_pose_estimator() -> PoseEstimator:
    global _estimator
    if _estimator is None:
        _estimator = PoseEstimator()
    return _estimator
