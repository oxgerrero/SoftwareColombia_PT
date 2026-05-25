from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import AccessTokenClaims, get_access_claims
from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    """Todos los roles pueden listar proyectos del workspace activo."""
    return ProjectService(db).list_projects(workspace_id=claims.workspace_id)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    """Crea un proyecto. Requiere rol Admin o Editor."""
    return ProjectService(db).create_project(
        body, workspace_id=claims.workspace_id, user_id=claims.user_id, role=claims.role
    )


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    """Edita un proyecto. Requiere rol Admin o Editor."""
    return ProjectService(db).update_project(
        str(project_id), body, workspace_id=claims.workspace_id, role=claims.role
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    claims: AccessTokenClaims = Depends(get_access_claims),
    db: Session = Depends(get_db),
):
    """Elimina un proyecto. Requiere rol Admin."""
    ProjectService(db).delete_project(
        str(project_id), workspace_id=claims.workspace_id, role=claims.role
    )
