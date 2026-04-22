from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.parcel import Parcel
from app.schemas.parcel import ParcelCreate, ParcelUpdate, ParcelOut

router = APIRouter()


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
