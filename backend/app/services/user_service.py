from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password
from app.domain.models import User
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    def register(self, email: str, password: str, full_name: str) -> User:
        if self._repo.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return self._repo.create(email, hash_password(password), full_name)

    def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> None:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        self._repo.update_password(user_id, hash_password(new_password))

    def search_by_email(self, query: str) -> list[User]:
        if len(query) < 2:
            return []
        return self._repo.search_by_email(query)
