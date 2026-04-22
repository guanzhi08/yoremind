from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ParcelStatus(str, enum.Enum):
    pending = "pending"
    reminded = "reminded"
    picked_up = "picked_up"
    expired = "expired"


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_name = Column(String, nullable=False)
    store_lat = Column(Float, nullable=True)
    store_lng = Column(Float, nullable=True)
    pickup_code = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(ParcelStatus), default=ParcelStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="parcels")
