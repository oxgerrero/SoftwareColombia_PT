from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


def _require_name(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Name cannot be empty")
    if len(v) > 255:
        raise ValueError("Name cannot exceed 255 characters")
    return v


class WorkspaceCreate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        return _require_name(v)


class WorkspaceUpdate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        return _require_name(v)


class WorkspaceOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str


class AddMemberRequest(BaseModel):
    email: str
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ("admin", "editor", "reader"):
            raise ValueError("Role must be admin, editor or reader")
        return v


class ChangeMemberRoleRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ("admin", "editor", "reader"):
            raise ValueError("Role must be admin, editor or reader")
        return v
