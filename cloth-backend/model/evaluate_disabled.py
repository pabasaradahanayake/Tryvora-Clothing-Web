"""
╔══════════════════════════════════════════════════════════╗
║         CLOTHING CLASSIFIER — EVALUATION SCRIPT          ║
║   Confusion Matrix | Per-class Metrics | Training Curves ║
║   Run AFTER train.py:  python model/evaluate.py          ║
╚══════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
from pathlib import Path

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
import matplotlib
matplotlib.use("Agg")          # non-interactive backend (saves to file)
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).resolve().parent.parent
VAL_DIR      = ROOT / "dataset" / "val"
MODEL_DIR    = ROOT / "model"
MODEL_PATH   = MODEL_DIR / "clothing_model.keras"
HISTORY_PATH = MODEL_DIR / "training_history.json"
PLOT_PATH    = MODEL_DIR / "training_plot.png"
CM_PATH      = MODEL_DIR / "confusion_matrix.png"

CLASSES = ["dress", "skirts", "pants", "shirt", "tshirt"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 32


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _banner(text: str) -> None:
    width = 64
    print(f"\n{'═' * width}")
    print(f"  {text}")
    print(f"{'═' * width}")


def print_confusion_matrix(cm: np.ndarray, class_names: list) -> None:
    """Pretty-print confusion matrix to terminal."""
    _banner("🔲  CONFUSION MATRIX  (rows=Actual, cols=Predicted)")
    n = len(class_names)
    col_w = 8

    # Header
    header = " " * 10
    for c in class_names:
        header += f"{c[:col_w]:>{col_w}}"
    print(header)
    print(" " * 10 + "─" * (col_w * n))

    for i, row_name in enumerate(class_names):
        row = f"  {row_name[:8]:>8}│"
        for j in range(n):
            val = cm[i, j]
            mark = f"[{val}]" if i == j else f" {val} "
            row += f"{mark:>{col_w}}"
        print(row)

    print()
    correct = np.trace(cm)
    total   = np.sum(cm)
    print(f"  Overall accuracy: {correct}/{total} = {correct/total:.2%}")


def print_per_class_metrics(report: dict) -> None:
    """Print precision/recall/F1 table."""
    _banner("📋  PER-CLASS METRICS")
    print(f"\n  {'Class':>12}  {'Precision':>10}  {'Recall':>8}  {'F1-Score':>9}  {'Support':>8}")
    print(f"  {'─'*12}  {'─'*10}  {'─'*8}  {'─'*9}  {'─'*8}")
    for cls in CLASSES:
        m = report.get(cls, {})
        p  = m.get("precision", 0)
        r  = m.get("recall", 0)
        f1 = m.get("f1-score", 0)
        s  = int(m.get("support", 0))
        bar = "█" * int(f1 * 10)
        print(f"  {cls:>12}  {p:10.4f}  {r:8.4f}  {f1:9.4f}  {s:8d}  {bar}")
    print()
    macro = report.get("macro avg", {})
    print(f"  {'macro avg':>12}  {macro.get('precision',0):10.4f}  {macro.get('recall',0):8.4f}  {macro.get('f1-score',0):9.4f}")


def save_training_plot(history: dict) -> None:
    """Save training/validation accuracy + loss curves as PNG."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.patch.set_facecolor("#1e1e2e")

    epochs = range(1, len(history["accuracy"]) + 1)

    # ── Accuracy ──
    ax = axes[0]
    ax.set_facecolor("#2a2a3e")
    ax.plot(epochs, history["accuracy"],     color="#89b4fa", linewidth=2, label="Train Acc")
    ax.plot(epochs, history["val_accuracy"], color="#a6e3a1", linewidth=2, linestyle="--", label="Val Acc")
    ax.set_title("Model Accuracy", color="white", fontsize=14, pad=10)
    ax.set_xlabel("Epoch", color="#cdd6f4")
    ax.set_ylabel("Accuracy", color="#cdd6f4")
    ax.legend(facecolor="#313244", labelcolor="white")
    ax.tick_params(colors="#cdd6f4")
    ax.spines[:].set_color("#45475a")
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(xmax=1.0))
    ax.grid(True, color="#45475a", alpha=0.4)

    # ── Loss ──
    ax = axes[1]
    ax.set_facecolor("#2a2a3e")
    ax.plot(epochs, history["loss"],     color="#f38ba8", linewidth=2, label="Train Loss")
    ax.plot(epochs, history["val_loss"], color="#fab387", linewidth=2, linestyle="--", label="Val Loss")
    ax.set_title("Model Loss", color="white", fontsize=14, pad=10)
    ax.set_xlabel("Epoch", color="#cdd6f4")
    ax.set_ylabel("Loss", color="#cdd6f4")
    ax.legend(facecolor="#313244", labelcolor="white")
    ax.tick_params(colors="#cdd6f4")
    ax.spines[:].set_color("#45475a")
    ax.grid(True, color="#45475a", alpha=0.4)

    fig.suptitle("Clothing Classifier — Training History", color="white", fontsize=16, y=1.02)
    plt.tight_layout()
    plt.savefig(PLOT_PATH, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"\n  📈  Training plot saved → {PLOT_PATH}")


def save_confusion_matrix_plot(cm: np.ndarray, class_names: list) -> None:
    """Save confusion matrix heatmap as PNG."""
    fig, ax = plt.subplots(figsize=(9, 7))
    fig.patch.set_facecolor("#1e1e2e")
    ax.set_facecolor("#2a2a3e")

    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    fig.colorbar(im, ax=ax)

    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha="right", color="#cdd6f4")
    ax.set_yticklabels(class_names, color="#cdd6f4")
    ax.set_xlabel("Predicted", color="#cdd6f4", fontsize=12)
    ax.set_ylabel("Actual", color="#cdd6f4", fontsize=12)
    ax.set_title("Confusion Matrix", color="white", fontsize=14, pad=10)
    ax.spines[:].set_color("#45475a")
    ax.tick_params(colors="#cdd6f4")

    thresh = cm.max() / 2.0
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            ax.text(j, i, str(cm[i, j]),
                    ha="center", va="center",
                    color="white" if cm[i, j] < thresh else "#1e1e2e",
                    fontsize=11, fontweight="bold")

    plt.tight_layout()
    plt.savefig(CM_PATH, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"  🔲  Confusion matrix plot saved → {CM_PATH}")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    _banner("🔍  CLOTHING CLASSIFIER — EVALUATION")

    # Check model exists
    if not MODEL_PATH.exists():
        print(f"\n  ⛔  Model not found at {MODEL_PATH}")
        print("  Run  python model/train.py  first.\n")
        sys.exit(1)

    # Load model
    print(f"\n  Loading model from {MODEL_PATH} ...")
    model = tf.keras.models.load_model(str(MODEL_PATH))
    print("  ✅  Model loaded.")

    # Build val generator
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    val_gen = ImageDataGenerator(rescale=1.0 / 255)
    val_data = val_gen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASSES,
        shuffle=False,
    )

    # ── 1. Overall accuracy ───────────────────────────────────────────────────
    _banner("🎯  OVERALL ACCURACY ON VALIDATION SET")
    loss, acc = model.evaluate(val_data, verbose=1)
    print(f"\n  Loss     : {loss:.4f}")
    print(f"  Accuracy : {acc:.2%}")

    # ── 2. Predictions for full metrics ───────────────────────────────────────
    val_data.reset()
    y_true = val_data.classes
    y_pred_probs = model.predict(val_data, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # ── 3. Confusion matrix ───────────────────────────────────────────────────
    from sklearn.metrics import confusion_matrix, classification_report
    cm = confusion_matrix(y_true, y_pred)
    print_confusion_matrix(cm, CLASSES)

    # ── 4. Per-class metrics ──────────────────────────────────────────────────
    report = classification_report(y_true, y_pred, target_names=CLASSES, output_dict=True)
    print_per_class_metrics(report)

    # ── 5. Save plots ─────────────────────────────────────────────────────────
    _banner("💾  SAVING PLOTS")
    if HISTORY_PATH.exists():
        with open(HISTORY_PATH) as f:
            history = json.load(f)
        save_training_plot(history)
    else:
        print("\n  ⚠️  training_history.json not found — skipping training plot.")

    save_confusion_matrix_plot(cm, CLASSES)

    # ── 6. Done ───────────────────────────────────────────────────────────────
    _banner("✅  EVALUATION COMPLETE")
    print(f"  training_plot.png    → {PLOT_PATH}")
    print(f"  confusion_matrix.png → {CM_PATH}\n")
    print("  Include both images in your report! 🎓\n")


if __name__ == "__main__":
    main()
