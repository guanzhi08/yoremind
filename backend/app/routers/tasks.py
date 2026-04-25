from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

TAIWAN_TZ = timezone(timedelta(hours=8))

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.schemas.checklist_item import ChecklistItemCreate, ChecklistItemOut
from app.models.checklist_item import ChecklistItem
from app.services.geofence import haversine_distance

router = APIRouter()


@router.get("", response_model=List[TaskOut])
def list_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Task).filter(Task.user_id == current_user.id).all()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = Task(**payload.model_dump(), user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/check-trigger", response_model=List[TaskOut])
def check_trigger(
    lat: float = Query(...),
    lng: float = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_time = datetime.now(TAIWAN_TZ).strftime("%H:%M")

    active_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.is_active == True,
        Task.lat.isnot(None),
        Task.lng.isnot(None),
    ).all()

    triggered = []
    for task in active_tasks:
        if haversine_distance(lat, lng, task.lat, task.lng) > task.radius_m:
            continue
        if task.time_start and task.time_end:
            if not (task.time_start <= current_time <= task.time_end):
                continue
        triggered.append(task)

    return triggered


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.post("/{task_id}/items", response_model=ChecklistItemOut, status_code=status.HTTP_201_CREATED)
def add_checklist_item(task_id: int, payload: ChecklistItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    item = ChecklistItem(task_id=task_id, label=payload.label)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
