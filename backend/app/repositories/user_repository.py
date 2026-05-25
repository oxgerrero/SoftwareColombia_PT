import uuid

from sqlalchemy.orm import Session

from app.domain.models import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email, User.is_active == True).first()

    def get_by_id(self, user_id: str) -> User | None:
        return (
            self._db.query(User)
            .filter(User.id == uuid.UUID(user_id), User.is_active == True)
            .first()
        )

    def create(self, email: str, password_hash: str, full_name: str) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def search_by_email(self, email_query: str, limit: int = 10) -> list[User]:
        pattern = f"%{email_query.lower()}%"
        return (
            self._db.query(User)
            .filter(User.email.ilike(pattern), User.is_active == True)
            .limit(limit)
            .all()
        )

    def update_password(self, user_id: str, new_password_hash: str) -> None:
        self._db.query(User).filter(User.id == uuid.UUID(user_id)).update(
            {"password_hash": new_password_hash}
        )
        self._db.commit()
