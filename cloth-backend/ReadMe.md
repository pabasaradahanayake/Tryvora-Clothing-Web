# Virtual Try-On Backend System

## Overview
This project is a high-performance Python backend system for an AI-powered Virtual Try-On application. It accepts user-uploaded photos, intelligently analyzes their body posture, predicts clothing categories and sizing, and ultimately maps a realistic 2D clothing overlay onto the image using advanced mathematical transformations.

---

## Core Technologies

*   **FastAPI**: The core web framework orchestrating the API endpoints, managing routing, and securely handling multipart high-resolution image uploads.
*   **MediaPipe Pose Landmarker**: Google's ML framework used to rapidly detect 33 human body landmarks (shoulders, hips, knees, ankles) accurately, featuring low-confidence suppression to handle partial/cropped body shots.
*   **MobileNetV2**: A lightweight deep convolutional neural network used in the prediction pipeline to classify the raw imagery of clothing items (e.g., pants vs. shirts vs. dresses).
*   **OpenCV (cv2)**: Utilized heavily for mathematical coordinate mapping, generating Affine transformation matrices, and calculating Perspective warping to physically alter clothing shapes.
*   **Pillow (PIL)**: Used for granular per-pixel manipulation, image resizing, and Alpha-channel compositing (blending transparent PNG overlays over the original photo without color ghosting).

---

## Technical Architecture & Pipeline Flow

The entire application relies on a strictly typed, sequential pipeline executed within the `/analyze` endpoint:

### 1. Image Ingestion & Validation (`analyze.py`)
The user uploads a portrait (and an optional `real_height_cm` threshold). FastAPI validates the headers and content-type, verifies it does not breach data payload limits (e.g., 10 MB), and safely decodes the image bytes into memory.

### 2. Clothing Classification (`classifier.py`)
If a specific clothing item wasn't manually overridden by the frontend, the loaded bytes are piped to a pre-trained MobileNetV2 model. The classifier scans the garment features and predicts its root category (shirt, pants, skirt, etc.) alongside a confidence interval to guide the downstream rendering engine.

### 3. Pose Detection & Measurement (`pose.py`)
MediaPipe performs inference directly on the uploaded photo to identify physical joints. 
*   **Landmark Mapping:** Key structural nodes like `LEFT_SHOULDER`, `RIGHT_HIP`, and `LEFT_ANKLE` are extracted.
*   **Anthropometric Estimation:** By plotting the distance between key landmarks in pixels and anchoring them against the user's real-world height, the engine dynamically calculates roughly accurate physical measurements (chest circumference, waist width, hip span) in Centimeters.

### 4. Size Recommendation (`size_recommender.py`)
Using the estimated physical measurements (e.g. `chest_cm`, `hip_cm`), a rule-based logic tier traverses standard sizing charts to recommend the ideal fit (XS, S, M, L, XL) for the user contextually based on the clothing type.

### 5. 2D Overlay Rendering Engine (`overlay.py`)
This is the visual core of the application. It relies on mathematical geometry to drape a pre-rendered, transparent clothing PNG onto the user's skeleton in real-time.

1.  **Metadata Injection**: The engine looks for a `.json` companion file matching the selected clothing item. This metadata defines the literal X,Y pixel coordinates of the joints *inside* the clothing PNG (defining where the "shoulders" or "hips" sit inside the fabric).
2.  **2-Point Affine Scaling (For Upper-Body / Shirts)**: 
    *   If the JSON defines a 2-point map (e.g., `LEFT_SHOULDER` & `RIGHT_SHOULDER`), OpenCV executes `cv2.getAffineTransform`. 
    *   This generates a "shape-preserving" similarity mapping. It scales the shirt horizontally to perfectly fit the span between the user's shoulders, while scaling the vertical drop proportionally so the aspect ratio is not destroyed. 
3.  **4-Point Perspective Warping (For Lower-Body / Pants & Skirts)**:
    *   If the JSON defines a 4-point structural map (e.g., Hips + Ankles, or Hips + Knees), OpenCV executes `cv2.getPerspectiveTransform`.
    *   This explicitly forces the 4 bounding zones of the clothing item to match the literal location of the 4 joints on the user. This independent axis morphing allows pants to stretch all the way to the floor, or skirts to stop perfectly tight at the knees, conforming physically to however the user is standing.
4.  **Fallback Sizing**: If no JSON or landmarks are present, the engine gracefully reverts to a mathematically proportional bounding box placement relative to the user's total image dimensions.
5.  **Alpha Blending**: The warped matrix is finalized, clamped inside the canvas bounds, and alpha-blended as a transparent layer over the raw portrait using Pillow. 

### 6. Data Delivery
FastAPI bundles the physical path of the newly rendered composite image, the calculated physical measurements, class confidences, and the recommended size into an optimized unified JSON payload sent back to the requesting client.

---

## Workflow Tooling
*   **Clothing Annotator (`clothing_annotator.html`)**: Included in the root is a native HTML5/JS tool designed strictly for administrators. Because the Overlay Engine requires exact internal coordinate metadata for its calculations, this tool allows admins to upload a transparent clothing image into the browser, select whether they are generating a 2-Point or 4-Point calibration, visually click the joints on the garment, and instantly copy the generated JSON payload.


.venv/Scripts/activate.ps1

uv pip install -r pyproject.toml

fastapi dev app/main.py


Important Note

If you add new images for try_out, cache won’t update automatically.
During development, you may need:

cached_clothing.cache_clear()