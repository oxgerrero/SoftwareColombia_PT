from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title="SaaS Project Management API",
    description="Multi-workspace project management with role-based access control",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(ValidationError)
async def validation_exception_handler(_: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
