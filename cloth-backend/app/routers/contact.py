from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database import get_db
from app.core.security import get_current_user_dep
from app.schemas.token import TokenData
from app.models.contact import ContactMessage
from app.schemas.contact import ContactCreate, ContactResponse, ContactReply

router = APIRouter(prefix="/contact", tags=["Contact"])

ADMIN_USERNAME = "tryvoraadmin"


def get_user_identity(current_user: TokenData):
    return (
        getattr(current_user, "username", None)
        or getattr(current_user, "email", None)
        or getattr(current_user, "sub", None)
    )


@router.post("/", response_model=ContactResponse)
def create_contact_message(
    payload: ContactCreate,
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if not user_identity:
        raise HTTPException(status_code=401, detail="Invalid user token.")

    new_message = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.strip(),
        subject=(payload.subject.strip() if payload.subject else None),
        message=payload.message.strip(),
        status="pending",
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message


@router.get("/my-messages", response_model=list[ContactResponse])
def get_my_messages(
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if not user_identity:
        raise HTTPException(status_code=401, detail="Invalid user token.")

    return (
        db.query(ContactMessage)
        .filter(ContactMessage.email == user_identity)
        .order_by(ContactMessage.created_at.desc())
        .all()
    )


@router.get("/my-messages/by-email/{email}", response_model=list[ContactResponse])
def get_my_messages_by_email(
    email: str,
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if not user_identity:
        raise HTTPException(status_code=401, detail="Invalid user token.")

    return (
        db.query(ContactMessage)
        .filter(ContactMessage.email == email.strip())
        .order_by(ContactMessage.created_at.desc())
        .all()
    )


@router.get("/admin/messages", response_model=list[ContactResponse])
def get_all_messages_for_admin(
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if user_identity != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Not authorized")

    return (
        db.query(ContactMessage)
        .order_by(ContactMessage.created_at.desc())
        .all()
    )


@router.put("/admin/messages/{message_id}/reply", response_model=ContactResponse)
def reply_to_message(
    message_id: int,
    payload: ContactReply,
    current_user: TokenData = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    user_identity = get_user_identity(current_user)

    if user_identity != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Not authorized")

    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")

    message.admin_reply = payload.reply.strip()
    message.status = "replied"
    message.replied_at = func.now()

    db.commit()
    db.refresh(message)

    return message