from pydantic import BaseModel
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


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: Optional[float] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    is_active: Optional[bool] = None


class TaskOut(BaseModel):
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
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    items: List[ChecklistItemOut] = []

    class Config:
        from_attributes = True
