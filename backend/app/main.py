from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, tasks, checklist, parcels, location, nominatim
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="YoRemind API", version="1.0.0")

@app.get("/health")
def health():
    return Response(content="OK", status_code=200)

@app.head("/health")
def health_check_head():
    return Response(status_code=200)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(checklist.router, prefix="/tasks", tags=["checklist"])
app.include_router(parcels.router, prefix="/parcels", tags=["parcels"])
app.include_router(location.router, prefix="/location", tags=["location"])
app.include_router(nominatim.router, prefix="/nominatim", tags=["nominatim"])