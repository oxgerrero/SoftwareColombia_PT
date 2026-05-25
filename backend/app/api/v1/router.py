from fastapi import APIRouter

from app.api.v1 import auth, projects, users, workspaces

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(workspaces.router)
api_router.include_router(users.router)
