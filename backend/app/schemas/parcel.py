from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.parcel import ParcelStatus


class ParcelCreate(BaseModel):
    store_name: str
    store_lat: Optional[float] = None
    store_lng: Optional[float] = None
    pickup_code: Optional[str] = None
    phone: Optional[str] = None
    expires_at: Optional[datetime] = None


class ParcelUpdate(BaseModel):
    store_name: Optional[str] = None
    store_lat: Optional[float] = None
    store_lng: Optional[float] = None
    pickup_code: Optional[str] = None
    phone: Optional[str] = None
    expires_at: Optional[datetime] = None
    status: Optional[ParcelStatus] = None


class ParcelOut(BaseModel):
    id: int
    user_id: int
    store_name: str
    store_lat: Optional[float] = None
    store_lng: Optional[float] = None
    pickup_code: Optional[str] = None
    phone: Optional[str] = None
    expires_at: Optional[datetime] = None
    status: ParcelStatus
    created_at: datetime

    class Config:
        from_attributes = True
