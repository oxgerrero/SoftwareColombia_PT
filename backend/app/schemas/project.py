from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


def _validate_name(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Project name cannot be empty")
    if len(v) > 255:
        raise ValueError("Project name cannot exceed 255 characters")
    return v


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        return _validate_name(v)


class ProjectUpdate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        return _validate_name(v)


class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    workspace_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
