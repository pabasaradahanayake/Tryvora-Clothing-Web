from sqlalchemy import Column, Integer, String

from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)

    # Admin username
    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    # Admin email
    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    # Hashed password
    hashed_password = Column(
        String(255),
        nullable=False,
    )