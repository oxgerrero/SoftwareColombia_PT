from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import AccessTokenClaims, SelectionTokenClaims, get_access_claims, get_authenticated_user_id
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import (
    AddMemberRequest,
    ChangeMemberRoleRequest,
    MemberOut,
    WorkspaceCreate,
    WorkspaceOut,
    WorkspaceUpdate,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def _svc(db: Session) -> WorkspaceService:
    return WorkspaceService(WorkspaceRepository(db), UserRepository(db))


@router.post("", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_workspace(
    body: WorkspaceCreate,
    user_id: str = Depends(get_authenticated_user_id),
    db: Session = Depends(get_db),
):
    return _svc(db).create(body.name, body.description, user_id)


@router.put("/{workspace_id}", response_model=WorkspaceOut)
def update_workspace(
    workspace_id: str,
    body: WorkspaceUpdate,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    return _svc(db).update(workspace_id, claims.user_id, body.name, body.description)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: str,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    _svc(db).delete(workspace_id, claims.user_id)


# ── members ───────────────────────────────────────────────────────────────────

@router.get("/{workspace_id}/members", response_model=list[MemberOut])
def list_members(
    workspace_id: str,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    members = _svc(db).list_members(workspace_id, claims.user_id)
    return [
        MemberOut(
            user_id=m.user_id,
            email=m.user.email,
            full_name=m.user.full_name,
            role=m.role,
        )
        for m in members
    ]


@router.post(
    "/{workspace_id}/members",
    response_model=MemberOut,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    workspace_id: str,
    body: AddMemberRequest,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    member = _svc(db).add_member(workspace_id, claims.user_id, body.email, body.role)
    return MemberOut(
        user_id=member.user_id,
        email=member.user.email,
        full_name=member.user.full_name,
        role=member.role,
    )


@router.put("/{workspace_id}/members/{user_id}", response_model=MemberOut)
def change_member_role(
    workspace_id: str,
    user_id: str,
    body: ChangeMemberRoleRequest,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    member = _svc(db).change_member_role(workspace_id, claims.user_id, user_id, body.role)
    return MemberOut(
        user_id=member.user_id,
        email=member.user.email,
        full_name=member.user.full_name,
        role=member.role,
    )


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    workspace_id: str,
    user_id: str,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    _svc(db).remove_member(workspace_id, claims.user_id, user_id)
