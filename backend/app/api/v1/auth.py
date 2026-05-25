from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import SelectionTokenClaims, get_selection_claims
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, TokenRequest, TokenResponse
from app.schemas.user import RegisterRequest, UserOut
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = UserService(UserRepository(db)).register(
        email=body.email,
        password=body.password,
        full_name=body.full_name,
    )
    return user


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(email=body.email, password=body.password)


@router.post("/token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def exchange_token(
    body: TokenRequest,
    claims: SelectionTokenClaims = Depends(get_selection_claims),
    db: Session = Depends(get_db),
):
    return AuthService(db).exchange_token(
        user_id=claims.user_id,
        workspace_id=str(body.workspace_id),
    )
