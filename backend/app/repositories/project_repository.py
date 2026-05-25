import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.domain.models import Project


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_by_workspace(self, workspace_id: str) -> list[Project]:
        return (
            self._db.query(Project)
            .filter(Project.workspace_id == workspace_id)
            .order_by(Project.created_at.desc())
            .all()
        )

    def get_by_id_and_workspace(self, project_id: str, workspace_id: str) -> Project | None:
        return (
            self._db.query(Project)
            .filter(
                Project.id == uuid.UUID(project_id),
                Project.workspace_id == uuid.UUID(workspace_id),
            )
            .first()
        )

    def create(self, *, name: str, description: str | None, workspace_id: str, created_by: str) -> Project:
        project = Project(
            name=name,
            description=description,
            workspace_id=uuid.UUID(workspace_id),
            created_by=uuid.UUID(created_by),
        )
        self._db.add(project)
        self._db.commit()
        self._db.refresh(project)
        return project

    def update(self, project: Project, *, name: str, description: str | None) -> Project:
        project.name = name
        project.description = description
        project.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self._db.delete(project)
        self._db.commit()
