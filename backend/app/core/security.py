from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import jwt

from app.core.config import settings

TOKEN_TYPE_SELECTION = "selection"
TOKEN_TYPE_ACCESS = "access"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(payload: dict[str, Any], expires_delta: timedelta) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)


def create_selection_token(user_id: str) -> str:
    return _create_token(
        {"sub": user_id, "type": TOKEN_TYPE_SELECTION},
        timedelta(minutes=settings.selection_token_expire_minutes),
    )


def create_access_token(user_id: str, workspace_id: str, role: str) -> str:
    return _create_token(
        {
            "sub": user_id,
            "workspace_id": workspace_id,
            "role": role,
            "type": TOKEN_TYPE_ACCESS,
        },
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and return claims. Raises JWTError on invalid/expired token."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
