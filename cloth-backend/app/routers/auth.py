from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    PASSWORD_HASH,
    create_access_token,
    get_current_user_dep,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.token import Token, TokenData
from app.schemas.user import UserResponse, UserCreate

router = APIRouter()

# Reusable alias
DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[TokenData, Depends(get_current_user_dep)]


# ---------------------------------------------------------------------------
# Google Auth Schema
# ---------------------------------------------------------------------------

class GoogleLoginRequest(BaseModel):
    credential: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def _get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def _authenticate_user(db: Session, username: str, password: str) -> User | bool:
    user = _get_user_by_username(db, username)
    if not user:
        verify_password(password, PASSWORD_HASH)  # timing-safe rejection
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with username, email, and password."""
    if _get_user_by_username(db, body.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if _get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=body.username,
        email=body.email,
        hashed_password=get_password_hash(body.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DBSession,
) -> Token:
    """Exchange username + password for a JWT access token."""
    user = _authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/auth/google-login", response_model=Token)
async def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Login with Google and return the app JWT token."""
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential,
            requests.Request(),
            audience=None,
        )

        email = idinfo.get("email")
        name = idinfo.get("name") or "Google User"

        if not email:
            raise HTTPException(status_code=400, detail="Google email not found")

        user = _get_user_by_email(db, email)

        if not user:
            base_username = email.split("@")[0].replace(".", "_").replace("-", "_")
            username = base_username
            counter = 1

            while _get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash(f"google_auth_{email}"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return Token(access_token=access_token, token_type="bearer")

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/users/me", response_model=UserResponse)
async def read_users_me(
    token_data: CurrentUser,
    db: Session = Depends(get_db),
) -> User:
    """Return the currently authenticated user's profile."""
    user = _get_user_by_username(db, token_data.username)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user