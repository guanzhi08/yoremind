from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.task import TaskType
from app.schemas.checklist_item import ChecklistItemOut


class TaskCreate(BaseModel):
    title: str
    type: TaskType = TaskType.reminder
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: float = 200.0
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    notif_sound: bool = True
    notif_vibrate: bool = True
    notif_lights: bool = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: Optional[float] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    is_active: Optional[bool] = None
    notif_sound: Optional[bool] = None
    notif_vibrate: Optional[bool] = None
    notif_lights: Optional[bool] = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    type: TaskType
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: float
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    is_active: bool
    notif_sound: bool = True
    notif_vibrate: bool = True
    notif_lights: bool = True
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    items: List[ChecklistItemOut] = []
