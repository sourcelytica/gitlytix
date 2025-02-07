from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/")
def read_stats():
    return {"message": "Hello, World!"}
