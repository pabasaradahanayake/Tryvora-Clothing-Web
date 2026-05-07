"""
╔══════════════════════════════════════════════════════════╗
║         CLOTHING CLASSIFIER — TRAINING SCRIPT            ║
║   MobileNetV2 Transfer Learning | 5 Categories           ║
║   Run: python model/train.py                             ║
╚══════════════════════════════════════════════════════════╝

BEFORE RUNNING:
  1. Drop images into dataset/train/<category>/ and dataset/val/<category>/
  2. Categories: shirt, tshirt, pants, dress, skirts
  3. Filename doesn't matter — only the folder name matters (Keras auto-labels)
"""

import os
import sys
import json
from pathlib import Path

# ── Suppress TF info logs (keep only warnings/errors) ─────────────────────────
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.applications import MobileNetV2

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).resolve().parent.parent   # cloth-backend/
DATASET_DIR  = ROOT / "dataset"
TRAIN_DIR    = DATASET_DIR / "train"
VAL_DIR      = DATASET_DIR / "val"
MODEL_DIR    = ROOT / "model"
MODEL_PATH   = MODEL_DIR / "clothing_model.keras"
HISTORY_PATH = MODEL_DIR / "training_history.json"

# ── Hyper-parameters ───────────────────────────────────────────────────────────
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS      = 15          # start here; early stopping will cut short if needed
FINE_TUNE   = True        # unfreeze top 30 layers after initial training
FT_EPOCHS   = 5           # extra fine-tune epochs
CLASSES     = ["dress", "skirts", "pants", "shirt", "tshirt"]   # alphabetical


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _banner(text: str) -> None:
    """Print a pretty section banner."""
    width = 60
    print(f"\n{'═' * width}")
    print(f"  {text}")
    print(f"{'═' * width}")


def _check_dataset() -> None:
    """Validate dataset folders exist and have images."""
    _banner("📁  DATASET CHECK")
    all_ok = True
    for split, d in [("train", TRAIN_DIR), ("val", VAL_DIR)]:
        print(f"\n  [{split.upper()}]")
        for cls in CLASSES:
            folder = d / cls
            if not folder.exists():
                print(f"    ⚠️  {cls:12s} → folder missing!")
                all_ok = False
                continue
            n = len(list(folder.glob("*.*")))
            status = "✅" if n > 0 else "❌"
            bar = "█" * min(n // 10, 40)
            print(f"    {status} {cls:12s} → {n:4d} images  {bar}")
    print()
    if not all_ok:
        print("  ⛔  Some folders are missing.  Add images and re-run.\n")
        sys.exit(1)


def build_generators():
    """Create augmented train and clean val generators."""
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    train_gen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode="nearest",
    )
    val_gen = ImageDataGenerator(rescale=1.0 / 255)

    train_data = train_gen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASSES,
        shuffle=True,
    )
    val_data = val_gen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASSES,
        shuffle=False,
    )
    return train_data, val_data


def build_model() -> tf.keras.Model:
    """MobileNetV2 base + custom classification head."""
    base = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights="imagenet")
    base.trainable = False   # freeze all base layers initially

    model = models.Sequential([
        base,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(len(CLASSES), activation="softmax"),
    ], name="ClothingClassifier")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def print_epoch_summary(history, phase: str) -> None:
    """Print a clean epoch-by-epoch accuracy table."""
    _banner(f"📊  {phase} RESULTS")
    acc  = history.history["accuracy"]
    val_acc = history.history["val_accuracy"]
    loss = history.history["loss"]
    val_loss = history.history["val_loss"]

    print(f"  {'Epoch':>5}  {'Train Acc':>9}  {'Val Acc':>8}  {'Train Loss':>10}  {'Val Loss':>9}")
    print(f"  {'─'*5}  {'─'*9}  {'─'*8}  {'─'*10}  {'─'*9}")
    for i, (a, va, l, vl) in enumerate(zip(acc, val_acc, loss, val_loss), 1):
        flag = "  ◀ best" if va == max(val_acc) else ""
        print(f"  {i:5d}  {a:9.4f}  {va:8.4f}  {l:10.4f}  {vl:9.4f}{flag}")

    best_val = max(val_acc)
    print(f"\n  ✅  Best Validation Accuracy: {best_val:.2%}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN TRAINING FLOW
# ══════════════════════════════════════════════════════════════════════════════

def main():
    _banner("🚀  CLOTHING CLASSIFIER — START TRAINING")
    print(f"  TensorFlow version : {tf.__version__}")
    print(f"  GPU available      : {bool(tf.config.list_physical_devices('GPU'))}")
    print(f"  Model output       : {MODEL_PATH}")

    # 1. Validate dataset
    _check_dataset()

    # 2. Build data generators
    _banner("🔄  LOADING DATASET")
    train_data, val_data = build_generators()
    print(f"  Classes  : {train_data.class_indices}")
    print(f"  Train    : {train_data.samples} images")
    print(f"  Val      : {val_data.samples} images")

    # 3. Build model
    _banner("🏗️   BUILDING MODEL")
    model = build_model()
    model.summary()

    # 4. Callbacks
    cb_early  = callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True)
    cb_reduce = callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, verbose=1)
    cb_ckpt   = callbacks.ModelCheckpoint(str(MODEL_PATH), save_best_only=True, monitor="val_accuracy", verbose=1)

    # 5. Phase 1 — train classifier head only
    _banner("🏋️   PHASE 1 — TRAINING CLASSIFIER HEAD")
    print(f"  Epochs    : {EPOCHS}  (early stopping enabled)")
    print(f"  BatchSize : {BATCH_SIZE}")
    print()

    history1 = model.fit(
        train_data,
        validation_data=val_data,
        epochs=EPOCHS,
        callbacks=[cb_early, cb_reduce, cb_ckpt],
    )
    print_epoch_summary(history1, "PHASE 1")

    # 6. Phase 2 — fine-tune top layers of MobileNetV2
    all_history = {k: list(v) for k, v in history1.history.items()}

    if FINE_TUNE:
        _banner("🔓  PHASE 2 — FINE-TUNING TOP LAYERS")
        base_model = model.layers[0]
        base_model.trainable = True
        # Unfreeze only top 30 layers
        for layer in base_model.layers[:-30]:
            layer.trainable = False

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),   # low LR for ft
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )
        print(f"  Trainable params after unfreeze: {sum(w.numpy().size for w in model.trainable_weights):,}")

        history2 = model.fit(
            train_data,
            validation_data=val_data,
            epochs=FT_EPOCHS,
            callbacks=[cb_early, cb_reduce, cb_ckpt],
        )
        print_epoch_summary(history2, "PHASE 2 — FINE-TUNE")

        for k, v in history2.history.items():
            all_history.setdefault(k, []).extend(v)

    # 7. Save full training history for evaluate.py
    with open(HISTORY_PATH, "w") as f:
        json.dump(all_history, f, indent=2)

    # 8. Final summary
    _banner("✅  TRAINING COMPLETE")
    print(f"  Model saved  → {MODEL_PATH}")
    print(f"  History saved → {HISTORY_PATH}")
    print(f"\n  Now run:  python model/evaluate.py")
    print()


if __name__ == "__main__":
    main()
