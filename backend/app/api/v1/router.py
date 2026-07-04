from fastapi import APIRouter

from app.ai.rag.router import router as rag_router
from app.api.v1.frameworks import router as frameworks_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.users import router as users_router
from app.assessments.router import router as assessments_router
from app.assets.router import router as assets_router
from app.auth.router import router as auth_router
from app.dashboard.router import router as dashboard_router
from app.organizations.router import router as organizations_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(frameworks_router, prefix="/frameworks", tags=["Frameworks"])
api_router.include_router(permissions_router, prefix="/permissions", tags=["Permissions & Access Control"])
api_router.include_router(organizations_router, prefix="/orgs", tags=["Organizations"])
api_router.include_router(rag_router, prefix="/rag", tags=["RAG System"])
api_router.include_router(assessments_router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(assets_router, prefix="/assets", tags=["Infrastructure Assets"])
