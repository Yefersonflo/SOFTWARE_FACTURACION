import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import SessionLocal, engine
from app.models import all_models
from app.core.security import get_password_hash

def init():
    all_models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Crear admin si no existe
    user = db.query(all_models.User).filter(all_models.User.username == "admin").first()
    if not user:
        admin_user = all_models.User(
            username="admin",
            password_hash=get_password_hash("Yeferson9610"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print("Usuario administrador creado: admin / Yeferson9610")
    else:
        print("El usuario administrador ya existe.")
    db.close()

if __name__ == "__main__":
    init()
