from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    TOKEN_TYPE_SELECTION,
    create_access_token,
    create_selection_token,
    decode_token,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.auth import LoginResponse, TokenResponse, UserOut, WorkspaceOut


class AuthService:
    def __init__(self, db: Session) -> None:
        self._users = UserRepository(db)
        self._workspaces = WorkspaceRepository(db)

    def login(self, email: str, password: str) -> LoginResponse:
        user = self._users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        memberships = self._workspaces.get_memberships_for_user(str(user.id))
        workspaces = [
            WorkspaceOut(
                id=m.workspace.id,
                name=m.workspace.name,
                description=m.workspace.description,
                role=m.role,
            )
            for m in memberships
        ]

        return LoginResponse(
            user=UserOut.model_validate(user),
            workspaces=workspaces,
            selection_token=create_selection_token(str(user.id)),
        )

    def exchange_token(self, user_id: str, workspace_id: str) -> TokenResponse:
        membership = self._workspaces.get_membership(user_id, workspace_id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this workspace",
            )

        workspace_out = WorkspaceOut(
            id=membership.workspace.id,
            name=membership.workspace.name,
            description=membership.workspace.description,
            role=membership.role,
        )

        return TokenResponse(
            access_token=create_access_token(
                user_id=user_id,
                workspace_id=workspace_id,
                role=membership.role,
            ),
            workspace=workspace_out,
        )
