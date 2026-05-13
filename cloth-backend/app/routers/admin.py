from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.user import User
from app.schemas.admin import AdminToken
from app.core.security import verify_password, create_access_token, get_current_user_dep
from app.schemas.token import TokenData

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_USERNAME = "tryvoraadmin"


def get_user_identity(current_user: TokenData):
    return (
        getattr(current_user, "username", None)
        or getattr(current_user, "email", None)
        or getattr(current_user, "sub", None)
    )


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


@router.get("/users")
def get_all_users_for_admin(
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if user_identity != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "username": getattr(user, "username", None),
            "email": getattr(user, "email", None),
        }
        for user in users
    ]


@router.delete("/users/{user_id}")
def delete_user_for_admin(
    user_id: int,
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if user_identity != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}