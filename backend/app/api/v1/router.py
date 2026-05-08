from fastapi import APIRouter
from app.auth.router import router as auth_router
from app.api.v1.users import router as users_router
from app.organizations.router import router as organizations_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(
    organizations_router, prefix="/organizations", tags=["Organizations"]
)
