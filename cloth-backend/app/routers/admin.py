from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminToken
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login", response_model=AdminToken)
def admin_login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # 🔹 Now using username instead of email
    admin = db.query(Admin).filter(Admin.username == username).first()

    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )

    # 🔹 token ekata username daanawa
    access_token = create_access_token(data={"sub": admin.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }