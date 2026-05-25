from fastapi import HTTPException, status

from app.domain.models import Workspace, WorkspaceMember
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository


class WorkspaceService:
    def __init__(self, ws_repo: WorkspaceRepository, user_repo: UserRepository) -> None:
        self._ws = ws_repo
        self._users = user_repo

    def _require_admin(self, workspace_id: str, user_id: str) -> None:
        member = self._ws.get_membership(user_id, workspace_id)
        if not member or member.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")

    # ── workspace CRUD ────────────────────────────────────────────────────────

    def create(self, name: str, description: str | None, owner_id: str) -> Workspace:
        return self._ws.create_workspace(name, description, owner_id)

    def update(
        self, workspace_id: str, user_id: str, name: str, description: str | None
    ) -> Workspace:
        self._require_admin(workspace_id, user_id)
        ws = self._ws.update_workspace(workspace_id, name, description)
        if not ws:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        return ws

    def delete(self, workspace_id: str, user_id: str) -> None:
        self._require_admin(workspace_id, user_id)
        if not self._ws.delete_workspace(workspace_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # ── member management ─────────────────────────────────────────────────────

    def list_members(self, workspace_id: str, requester_id: str) -> list[WorkspaceMember]:
        if not self._ws.get_membership(requester_id, workspace_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")
        return self._ws.get_members(workspace_id)

    def add_member(
        self, workspace_id: str, requester_id: str, email: str, role: str
    ) -> WorkspaceMember:
        self._require_admin(workspace_id, requester_id)
        target = self._users.get_by_email(email)
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        existing = self._ws.get_membership(str(target.id), workspace_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User is already a member"
            )
        return self._ws.add_member(workspace_id, str(target.id), role)

    def change_member_role(
        self, workspace_id: str, requester_id: str, target_user_id: str, role: str
    ) -> WorkspaceMember:
        self._require_admin(workspace_id, requester_id)
        if requester_id == target_user_id and role != "admin":
            if self._ws.count_admins(workspace_id) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin",
                )
        member = self._ws.update_member_role(workspace_id, target_user_id, role)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        return member

    def remove_member(
        self, workspace_id: str, requester_id: str, target_user_id: str
    ) -> None:
        self._require_admin(workspace_id, requester_id)
        if requester_id == target_user_id:
            if self._ws.count_admins(workspace_id) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin",
                )
        if not self._ws.remove_member(workspace_id, target_user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
