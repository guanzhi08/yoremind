from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.checklist_item import ChecklistItem
from app.schemas.checklist_item import ChecklistItemUpdate, ChecklistItemOut

router = APIRouter()


@router.patch("/{task_id}/items/{item_id}", response_model=ChecklistItemOut)
def update_checklist_item(
    task_id: int,
    item_id: int,
    payload: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.task_id == task_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{task_id}/items/{item_id}", status_code=204)
def delete_checklist_item(
    task_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.task_id == task_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
