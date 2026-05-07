from datetime import datetime
from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str | None = None
    message: str


class ContactResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str | None
    message: str

    admin_reply: str | None
    status: str

    created_at: datetime
    replied_at: datetime | None

    class Config:
        from_attributes = True


class ContactReply(BaseModel):
    reply: str