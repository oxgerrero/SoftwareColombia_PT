from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password cannot be empty")
        return v


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str

    model_config = {"from_attributes": True}


class WorkspaceOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    role: str

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UserOut
    workspaces: list[WorkspaceOut]
    selection_token: str


class TokenRequest(BaseModel):
    workspace_id: UUID


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    workspace: WorkspaceOut
