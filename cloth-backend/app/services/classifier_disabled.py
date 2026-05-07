"""
app/services/classifier.py
─────────────────────────
MobileNetV2 inference service.
Loaded ONCE at application startup — not per request.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np

# Suppress TF info logs
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import tensorflow as tf
from PIL import Image
import io

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "model" / "clothing_model.keras"

# Alphabetical order must MATCH the order used during training (flow_from_directory sorts)
CLASSES = ["dress", "skirts", "pants", "shirt", "tshirt"]
IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.50     # below this → flag as low_confidence


class ClothingClassifier:
    """Singleton-style wrapper around a saved Keras model."""

    _instance: "ClothingClassifier | None" = None

    def __init__(self) -> None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Run  python model/train.py  first."
            )
        self.model = tf.keras.models.load_model(str(MODEL_PATH))
        print(f"[Classifier] Model loaded from {MODEL_PATH}")

    # ── Public API ────────────────────────────────────────────────────────────

    def predict(self, image_bytes: bytes) -> dict:
        """
        Classify clothing from raw image bytes.

        Returns:
            {
                "category": str,
                "confidence": float,
                "low_confidence": bool,
                "all_scores": dict[str, float]
            }
        """
        img_array = self._preprocess(image_bytes)
        probs = self.model.predict(img_array, verbose=0)[0]  # shape (5,)
        idx   = int(np.argmax(probs))
        conf  = float(probs[idx])

        return {
            "category":       CLASSES[idx],
            "confidence":     round(conf, 4),
            "low_confidence": conf < CONFIDENCE_THRESHOLD,
            "all_scores":     {cls: round(float(p), 4) for cls, p in zip(CLASSES, probs)},
        }

    # ── Internal ─────────────────────────────────────────────────────────────

    @staticmethod
    def _preprocess(image_bytes: bytes) -> np.ndarray:
        """Decode → resize → normalize → add batch dim."""
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise ValueError(f"Cannot decode image: {exc}") from exc

        img = img.resize(IMG_SIZE, Image.LANCZOS)
        arr = np.array(img, dtype=np.float32) / 255.0   # [0, 1]
        return np.expand_dims(arr, axis=0)               # (1, 224, 224, 3)


# ── Module-level singleton (loaded at import time by routers) ─────────────────
_classifier: ClothingClassifier | None = None


def get_classifier() -> ClothingClassifier:
    """Return the shared classifier instance (lazy init)."""
    global _classifier
    if _classifier is None:
        _classifier = ClothingClassifier()
    return _classifier
