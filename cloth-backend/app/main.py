from contextlib import asynccontextmanager
from pathlib import Path
import shutil
import json

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, SessionLocal
from app.routers.auth import router as auth_router
from app.routers.analyze import router as analyze_router
from app.routers.contact import router as contact_router
from app.routers.admin import router as admin_router

# ── Static directories ────────────────────────────────────────────────────────
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
OUTPUT_DIR = STATIC_DIR / "output"
CLOTHING_DIR = STATIC_DIR / "clothing_pngs"
CLOTHES_METADATA_FILE = STATIC_DIR / "clothes_metadata.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR.mkdir(parents=True, exist_ok=True)


def load_clothes_metadata():
    if not CLOTHES_METADATA_FILE.exists():
        return {}

    try:
        with CLOTHES_METADATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_clothes_metadata(metadata: dict):
    with CLOTHES_METADATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Ensure default admin exists (create if missing)
    try:
        from app.models.admin import Admin
        from app.core.security import get_password_hash

        db = SessionLocal()
        try:
            admin = db.query(Admin).filter_by(username="tryvoraadmin").first()
            if admin is None:
                new_admin = Admin(
                    username="tryvoraadmin",
                    email="admin@gmail.com",
                    hashed_password=get_password_hash("admin123"),
                )
                db.add(new_admin)
                db.commit()
                print("[Startup] ✅ Default admin created: tryvoraadmin")
            else:
                print("[Startup] ℹ️  Default admin already exists: tryvoraadmin")
        finally:
            db.close()
    except Exception as e:
        print("[Startup] ⚠️  Could not ensure default admin:", e)

    # Local classifier disabled because Hugging Face API will be used instead.
    # try:
    #     from app.services.classifier_disabled import get_classifier
    #     get_classifier()
    # except FileNotFoundError:
    #     print(
    #         "[Startup] ⚠️  clothing_model.keras not found. "
    #         "Run  python model/train.py  then restart the server."
    #     )

    # Keep MediaPipe Pose because it is still used for body detection / overlay process.
    from app.services.pose import get_pose_estimator
    get_pose_estimator()

    yield
    # (shutdown cleanup goes here if needed)


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ClothProject API — Virtual Try-On", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated overlay images and static clothing PNGs
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/clothes")
def get_clothes():
    clothes = []
    metadata = load_clothes_metadata()

    if not CLOTHING_DIR.exists():
        return clothes

    for file in CLOTHING_DIR.rglob("*"):
        if file.is_file() and file.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
            relative_path = file.relative_to(CLOTHING_DIR).as_posix()
            parts = relative_path.split("/")

            gender = parts[0] if len(parts) > 0 else "unknown"
            category = parts[1] if len(parts) > 1 else "unknown"

            item_metadata = metadata.get(relative_path, {})

            clothes.append(
                {
                    "name": file.name,
                    "gender": gender,
                    "category": category,
                    "image_url": f"http://127.0.0.1:8000/static/clothing_pngs/{relative_path}",
                    "path": relative_path,
                    "price": item_metadata.get("price", 0),
                }
            )

    return clothes


@app.post("/clothes/upload")
async def upload_cloth(
    gender: str = Form(...),
    category: str = Form(...),
    price: float = Form(0),
    file: UploadFile = File(...),
):
    allowed_extensions = [".png", ".jpg", ".jpeg", ".webp"]
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG, JPEG, and WEBP files are allowed.",
        )

    if price < 0:
        raise HTTPException(
            status_code=400,
            detail="Price cannot be negative.",
        )

    safe_gender = gender.strip().lower().replace(" ", "_")
    safe_category = category.strip().lower().replace(" ", "_")
    safe_filename = Path(file.filename).name.replace(" ", "_")

    save_dir = CLOTHING_DIR / safe_gender / safe_category
    save_dir.mkdir(parents=True, exist_ok=True)

    save_path = save_dir / safe_filename

    if save_path.exists():
        raise HTTPException(
            status_code=400,
            detail="A clothing image with this file name already exists.",
        )

    with save_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_path = save_path.relative_to(CLOTHING_DIR).as_posix()

    metadata = load_clothes_metadata()
    metadata[relative_path] = {
        "price": price,
    }
    save_clothes_metadata(metadata)

    return {
        "message": "Clothing image uploaded successfully",
        "name": save_path.name,
        "gender": safe_gender,
        "category": safe_category,
        "image_url": f"http://127.0.0.1:8000/static/clothing_pngs/{relative_path}",
        "path": relative_path,
        "price": price,
    }


@app.put("/clothes/price")
def update_cloth_price(path: str = Form(...), price: float = Form(...)):
    if not path:
        raise HTTPException(status_code=400, detail="Image path is required.")

    if price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative.")

    target_path = (CLOTHING_DIR / path).resolve()
    clothing_root = CLOTHING_DIR.resolve()

    if not str(target_path).startswith(str(clothing_root)):
        raise HTTPException(status_code=400, detail="Invalid image path.")

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Clothing image not found.")

    metadata = load_clothes_metadata()
    metadata[path] = {
        **metadata.get(path, {}),
        "price": price,
    }
    save_clothes_metadata(metadata)

    return {
        "message": "Clothing price updated successfully",
        "path": path,
        "price": price,
    }


@app.delete("/clothes/delete")
def delete_cloth(path: str):
    if not path:
        raise HTTPException(status_code=400, detail="Image path is required.")

    target_path = (CLOTHING_DIR / path).resolve()
    clothing_root = CLOTHING_DIR.resolve()

    if not str(target_path).startswith(str(clothing_root)):
        raise HTTPException(status_code=400, detail="Invalid image path.")

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Clothing image not found.")

    target_path.unlink()

    metadata = load_clothes_metadata()
    if path in metadata:
        del metadata[path]
        save_clothes_metadata(metadata)

    return {"message": "Clothing image deleted successfully"}


app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(contact_router)
app.include_router(admin_router)