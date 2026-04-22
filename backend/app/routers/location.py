from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.parcel import Parcel, ParcelStatus
from app.services.geofence import haversine_distance
from app.services.fcm import send_notification

router = APIRouter()

TRIGGER_COOLDOWN_MINUTES = 30


class LocationUpdate(BaseModel):
    lat: float
    lng: float
    fcm_token: Optional[str] = None


@router.post("/update")
def update_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.fcm_token and current_user.fcm_token != payload.fcm_token:
        current_user.fcm_token = payload.fcm_token
        db.add(current_user)

    now = datetime.now(timezone.utc)
    triggered = []

    active_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.is_active == True,
        Task.lat.isnot(None),
        Task.lng.isnot(None),
    ).all()

    for task in active_tasks:
        distance = haversine_distance(payload.lat, payload.lng, task.lat, task.lng)
        if distance > task.radius_m:
            continue

        if task.last_triggered_at:
            elapsed = now - task.last_triggered_at.replace(tzinfo=timezone.utc)
            if elapsed < timedelta(minutes=TRIGGER_COOLDOWN_MINUTES):
                continue

        if task.time_start and task.time_end:
            current_time = now.strftime("%H:%M")
            if not (task.time_start <= current_time <= task.time_end):
                continue

        fcm_token = current_user.fcm_token
        if fcm_token:
            send_notification(fcm_token, title=f"YoRemind: {task.title}", body="你已抵達提醒地點！")

        task.last_triggered_at = now
        db.add(task)
        triggered.append(task.id)

    active_parcels = db.query(Parcel).filter(
        Parcel.user_id == current_user.id,
        Parcel.status == ParcelStatus.pending,
        Parcel.store_lat.isnot(None),
        Parcel.store_lng.isnot(None),
    ).all()

    for parcel in active_parcels:
        distance = haversine_distance(payload.lat, payload.lng, parcel.store_lat, parcel.store_lng)
        if distance <= 300:
            fcm_token = current_user.fcm_token
            if fcm_token:
                send_notification(
                    fcm_token,
                    title=f"取貨提醒：{parcel.store_name}",
                    body=f"你在附近！取貨碼：{parcel.pickup_code or '請查看 App'}",
                )
            parcel.status = ParcelStatus.reminded
            db.add(parcel)
            triggered.append(f"parcel_{parcel.id}")

    db.commit()
    return {"triggered": triggered, "checked_tasks": len(active_tasks), "checked_parcels": len(active_parcels)}
