import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.parcel import Parcel
from app.schemas.parcel import ParcelCreate, ParcelUpdate, ParcelOut, ScreenshotParseResult

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/parse-screenshot", response_model=ScreenshotParseResult)
async def parse_parcel_screenshot(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    ct = image.content_type or "image/jpeg"
    if ct not in allowed:
        raise HTTPException(status_code=400, detail="Only jpeg/png/webp accepted")
    data = await image.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")
    try:
        from app.services.ocr import parse_screenshot
        result = await parse_screenshot(data, ct)
        return result
    except Exception as e:
        logger.error("OCR failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Screenshot parsing failed: {e}")


@router.get("", response_model=List[ParcelOut])
def list_parcels(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Parcel).filter(Parcel.user_id == current_user.id).all()


@router.post("", response_model=ParcelOut, status_code=status.HTTP_201_CREATED)
def create_parcel(payload: ParcelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    parcel = Parcel(**payload.model_dump(), user_id=current_user.id)
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.get("/{parcel_id}", response_model=ParcelOut)
def get_parcel(parcel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id, Parcel.user_id == current_user.id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel


@router.patch("/{parcel_id}", response_model=ParcelOut)
def update_parcel(parcel_id: int, payload: ParcelUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id, Parcel.user_id == current_user.id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(parcel, field, value)
    db.commit()
    db.refresh(parcel)
    return parcel


@router.delete("/{parcel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parcel(parcel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id, Parcel.user_id == current_user.id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    db.delete(parcel)
    db.commit()
