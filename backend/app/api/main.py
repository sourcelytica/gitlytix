from fastapi import APIRouter

from app.api.routes import stats, issues, prs
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(stats.router)
api_router.include_router(issues.router)
api_router.include_router(prs.router)