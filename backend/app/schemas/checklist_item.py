from pydantic import BaseModel, ConfigDict
from typing import Optional


class ChecklistItemCreate(BaseModel):
    label: str


class ChecklistItemUpdate(BaseModel):
    label: Optional[str] = None
    is_checked: Optional[bool] = None


class ChecklistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    label: str
    is_checked: bool
