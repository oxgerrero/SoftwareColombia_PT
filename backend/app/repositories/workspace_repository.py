import uuid

from sqlalchemy.orm import Session, joinedload

from app.domain.models import Workspace, WorkspaceMember


class WorkspaceRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    # ── membership queries ────────────────────────────────────────────────────

    def get_memberships_for_user(self, user_id: str) -> list[WorkspaceMember]:
        return (
            self._db.query(WorkspaceMember)
            .options(joinedload(WorkspaceMember.workspace))
            .filter(WorkspaceMember.user_id == uuid.UUID(user_id))
            .all()
        )

    def get_membership(self, user_id: str, workspace_id: str) -> WorkspaceMember | None:
        return (
            self._db.query(WorkspaceMember)
            .options(joinedload(WorkspaceMember.workspace))
            .filter(
                WorkspaceMember.user_id == uuid.UUID(user_id),
                WorkspaceMember.workspace_id == uuid.UUID(workspace_id),
            )
            .first()
        )

    # ── workspace CRUD ────────────────────────────────────────────────────────

    def get_workspace(self, workspace_id: str) -> Workspace | None:
        return (
            self._db.query(Workspace)
            .filter(Workspace.id == uuid.UUID(workspace_id))
            .first()
        )

    def create_workspace(self, name: str, description: str | None, owner_id: str) -> Workspace:
        ws = Workspace(name=name, description=description)
        self._db.add(ws)
        self._db.flush()
        member = WorkspaceMember(
            user_id=uuid.UUID(owner_id),
            workspace_id=ws.id,
            role="admin",
        )
        self._db.add(member)
        self._db.commit()
        self._db.refresh(ws)
        return ws

    def update_workspace(
        self, workspace_id: str, name: str, description: str | None
    ) -> Workspace | None:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return None
        ws.name = name
        ws.description = description
        self._db.commit()
        self._db.refresh(ws)
        return ws

    def delete_workspace(self, workspace_id: str) -> bool:
        ws = self.get_workspace(workspace_id)
        if not ws:
            return False
        self._db.delete(ws)
        self._db.commit()
        return True

    # ── member management ─────────────────────────────────────────────────────

    def get_members(self, workspace_id: str) -> list[WorkspaceMember]:
        return (
            self._db.query(WorkspaceMember)
            .options(joinedload(WorkspaceMember.user))
            .filter(WorkspaceMember.workspace_id == uuid.UUID(workspace_id))
            .all()
        )

    def add_member(self, workspace_id: str, user_id: str, role: str) -> WorkspaceMember:
        member = WorkspaceMember(
            user_id=uuid.UUID(user_id),
            workspace_id=uuid.UUID(workspace_id),
            role=role,
        )
        self._db.add(member)
        self._db.commit()
        return (
            self._db.query(WorkspaceMember)
            .options(joinedload(WorkspaceMember.user))
            .filter(WorkspaceMember.id == member.id)
            .one()
        )

    def update_member_role(
        self, workspace_id: str, user_id: str, role: str
    ) -> WorkspaceMember | None:
        member = (
            self._db.query(WorkspaceMember)
            .options(joinedload(WorkspaceMember.user))
            .filter(
                WorkspaceMember.workspace_id == uuid.UUID(workspace_id),
                WorkspaceMember.user_id == uuid.UUID(user_id),
            )
            .first()
        )
        if not member:
            return None
        member.role = role
        self._db.commit()
        self._db.refresh(member)
        return member

    def remove_member(self, workspace_id: str, user_id: str) -> bool:
        deleted = (
            self._db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == uuid.UUID(workspace_id),
                WorkspaceMember.user_id == uuid.UUID(user_id),
            )
            .delete()
        )
        self._db.commit()
        return deleted > 0

    def count_admins(self, workspace_id: str) -> int:
        return (
            self._db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == uuid.UUID(workspace_id),
                WorkspaceMember.role == "admin",
            )
            .count()
        )
