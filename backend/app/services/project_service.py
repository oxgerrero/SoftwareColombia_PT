from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.domain.enums import Role
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate


class ProjectService:
    def __init__(self, db: Session) -> None:
        self._repo = ProjectRepository(db)

    def list_projects(self, workspace_id: str) -> list[ProjectOut]:
        return [ProjectOut.model_validate(p) for p in self._repo.list_by_workspace(workspace_id)]

    def create_project(self, payload: ProjectCreate, *, workspace_id: str, user_id: str, role: str) -> ProjectOut:
        if not Role(role).can_write():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Readers cannot create projects")

        project = self._repo.create(
            name=payload.name,
            description=payload.description,
            workspace_id=workspace_id,
            created_by=user_id,
        )
        return ProjectOut.model_validate(project)

    def update_project(self, project_id: str, payload: ProjectUpdate, *, workspace_id: str, role: str) -> ProjectOut:
        if not Role(role).can_write():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Readers cannot edit projects")

        project = self._repo.get_by_id_and_workspace(project_id, workspace_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        updated = self._repo.update(project, name=payload.name, description=payload.description)
        return ProjectOut.model_validate(updated)

    def delete_project(self, project_id: str, *, workspace_id: str, role: str) -> None:
        if not Role(role).can_delete():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete projects")

        project = self._repo.get_by_id_and_workspace(project_id, workspace_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        self._repo.delete(project)
