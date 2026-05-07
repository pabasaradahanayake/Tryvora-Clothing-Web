from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: str | None = None

# --- Pydantic schema for API responses (never exposes hashed_password) ---
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = {"from_attributes": True}

# --- Pydantic schema for the register request body ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
