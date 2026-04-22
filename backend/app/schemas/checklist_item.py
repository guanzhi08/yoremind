from pydantic import BaseModel
from typing import Optional


class ChecklistItemCreate(BaseModel):
    label: str


class ChecklistItemUpdate(BaseModel):
    label: Optional[str] = None
    is_checked: Optional[bool] = None


class ChecklistItemOut(BaseModel):
    id: int
    task_id: int
    label: str
    is_checked: bool

    class Config:
        from_attributes = True
