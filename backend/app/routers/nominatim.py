from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
HEADERS = {
    "User-Agent": "YoRemind/1.0 (guanzhi.chen@gmail.com)",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}


@router.get("/search")
async def search_places(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{NOMINATIM_BASE}/search",
                params={"q": q, "format": "json", "limit": limit, "addressdetails": 1},
                headers=HEADERS,
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Nominatim error: {e}")


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...),
    current_user: User = Depends(get_current_user),
):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{NOMINATIM_BASE}/reverse",
                params={"lat": lat, "lon": lng, "format": "json"},
                headers=HEADERS,
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Nominatim error: {e}")
