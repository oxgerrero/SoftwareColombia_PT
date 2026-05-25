from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.security import TOKEN_TYPE_ACCESS, TOKEN_TYPE_SELECTION, decode_token

bearer_scheme = HTTPBearer()


@dataclass(frozen=True)
class SelectionTokenClaims:
    user_id: str


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: str
    workspace_id: str
    role: str


def _extract_token(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_selection_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> SelectionTokenClaims:
    claims = _extract_token(credentials)
    if claims.get("type") != TOKEN_TYPE_SELECTION:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A selection token is required for this endpoint",
        )
    return SelectionTokenClaims(user_id=claims["sub"])


def get_access_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AccessTokenClaims:
    claims = _extract_token(credentials)
    if claims.get("type") != TOKEN_TYPE_ACCESS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="An access token is required for this endpoint",
        )
    return AccessTokenClaims(
        user_id=claims["sub"],
        workspace_id=claims["workspace_id"],
        role=claims["role"],
    )


def get_authenticated_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """Accepts either a selection token or an access token — returns user_id."""
    claims = _extract_token(credentials)
    token_type = claims.get("type")
    if token_type not in (TOKEN_TYPE_SELECTION, TOKEN_TYPE_ACCESS):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return claims["sub"]
