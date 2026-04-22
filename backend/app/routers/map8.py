from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

MAP8_BASE = "https://api.map8.zone"


@router.get("/search")
async def search_places(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, le=20),
    current_user: User = Depends(get_current_user),
):
    if not settings.MAP8_API_KEY:
        raise HTTPException(status_code=503, detail="MAP8_API_KEY not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{MAP8_BASE}/place/textsearch/json",
            params={"query": q, "key": settings.MAP8_API_KEY, "language": "zh-TW"},
            timeout=10.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Map8 API error")
        return resp.json()


@router.get("/geocode")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
    current_user: User = Depends(get_current_user),
):
    if not settings.MAP8_API_KEY:
        raise HTTPException(status_code=503, detail="MAP8_API_KEY not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{MAP8_BASE}/geocode/json",
            params={"latlng": f"{lat},{lng}", "key": settings.MAP8_API_KEY, "language": "zh-TW"},
            timeout=10.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Map8 API error")
        return resp.json()
