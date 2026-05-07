from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
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
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


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

app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(contact_router)
app.include_router(admin_router)