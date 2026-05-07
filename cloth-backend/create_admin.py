from app.database import SessionLocal
from app.models.admin import Admin
from app.core.security import get_password_hash

db = SessionLocal()

admin = Admin(
    email="tryvoraadmin@gmail.com",
    hashed_password=get_password_hash("123456")
)

db.add(admin)
db.commit()
db.close()

print("Admin created successfully")