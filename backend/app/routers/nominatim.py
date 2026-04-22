from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {"User-Agent": "YoRemind/1.0 (contact@yoremind.app)"}


@router.get("/search")
async def search_places(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, le=20),
    current_user: User = Depends(get_current_user),
):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOMINATIM_BASE}/search",
            params={"q": q, "format": "json", "limit": limit, "addressdetails": 1},
            headers=HEADERS,
            timeout=10.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Nominatim API error")
        return resp.json()


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
    current_user: User = Depends(get_current_user),
):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOMINATIM_BASE}/reverse",
            params={"lat": lat, "lon": lng, "format": "json"},
            headers=HEADERS,
            timeout=10.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Nominatim API error")
        return resp.json()
