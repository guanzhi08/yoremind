from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TaskType(str, enum.Enum):
    reminder = "reminder"
    checklist = "checklist"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(Enum(TaskType), default=TaskType.reminder, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    radius_m = Column(Float, default=200.0)
    time_start = Column(String, nullable=True)  # "HH:MM" format
    time_end = Column(String, nullable=True)    # "HH:MM" format
    is_active = Column(Boolean, default=True)
    notif_sound = Column(Boolean, default=True, server_default="1")
    notif_vibrate = Column(Boolean, default=True, server_default="1")
    notif_lights = Column(Boolean, default=True, server_default="1")
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tasks")
    items = relationship("ChecklistItem", back_populates="task", cascade="all, delete-orphan")
