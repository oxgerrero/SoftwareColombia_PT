from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_user_id
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordRequest, UserOut
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/me/password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    user_id: str = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    UserService(UserRepository(db)).change_password(
        user_id, body.current_password, body.new_password
    )


@router.get("/search", response_model=list[UserOut])
def search_users(
    q: str = "",
    user_id: str = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    return UserService(UserRepository(db)).search_by_email(q)
