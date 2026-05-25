"""
Idempotent seed script.
Runs on every backend startup; skips silently if data already exists.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.domain.models import Base, Project, User, Workspace, WorkspaceMember


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


# Fixed UUIDs as proper uuid.UUID objects (required by SQLAlchemy UUID(as_uuid=True))
DEMO_USER_ID      = uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
WORKSPACE_ALFA_ID = uuid.UUID("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
WORKSPACE_BETA_ID = uuid.UUID("c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")


def seed() -> None:
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        if db.query(User).filter_by(id=DEMO_USER_ID).first():
            print("[seed] Database already seeded – skipping.")
            return

        print("[seed] Seeding database...")

        user = User(
            id=DEMO_USER_ID,
            email="admin@demo.com",
            password_hash=_hash("password123"),
            full_name="Demo Admin",
            is_active=True,
        )
        db.add(user)

        alfa = Workspace(id=WORKSPACE_ALFA_ID, name="Workspace Alfa", description="Espacio de trabajo principal")
        beta = Workspace(id=WORKSPACE_BETA_ID, name="Workspace Beta", description="Espacio de trabajo secundario")
        db.add_all([alfa, beta])

        db.add(WorkspaceMember(user_id=DEMO_USER_ID, workspace_id=WORKSPACE_ALFA_ID, role="admin"))
        db.add(WorkspaceMember(user_id=DEMO_USER_ID, workspace_id=WORKSPACE_BETA_ID, role="reader"))

        db.add_all([
            Project(name="Sistema de Gestión de Clientes", description="CRM integral para clientes enterprise", workspace_id=WORKSPACE_ALFA_ID, created_by=DEMO_USER_ID),
            Project(name="Portal de Reportes BI",          description="Dashboard con métricas en tiempo real",  workspace_id=WORKSPACE_ALFA_ID, created_by=DEMO_USER_ID),
            Project(name="Aplicación Móvil",               description="App nativa para iOS y Android",          workspace_id=WORKSPACE_BETA_ID, created_by=DEMO_USER_ID),
            Project(name="API de Integraciones",           description="Gateway con servicios de terceros",       workspace_id=WORKSPACE_BETA_ID, created_by=DEMO_USER_ID),
        ])

        db.commit()
        print("[seed] Done.")

    except Exception as exc:
        db.rollback()
        print(f"[seed] ERROR: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
