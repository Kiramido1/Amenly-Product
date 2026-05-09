from fastapi import APIRouter
from app.auth.router import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.frameworks import router as frameworks_router
from app.organizations.router import router as organizations_router
from app.ai.rag.router import router as rag_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(frameworks_router, prefix="/frameworks", tags=["Frameworks"])
api_router.include_router(
    organizations_router, prefix="/organizations", tags=["Organizations"]
)
api_router.include_router(rag_router, prefix="/rag", tags=["RAG System"])
