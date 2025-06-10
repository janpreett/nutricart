from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import init_db, SessionLocal, Profile
from app.database import generate_meal_plan

class ProfileCreate(BaseModel):
    user_id: int
    age: int
    weight: float
    height: float
    goal: str


app = FastAPI(title="NutriCart API")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
async def read_root():
    return {"message": "NutriCart (Group 3 Capstone Project) backend!"}

@app.post("/profile", status_code=201)
def create_profile(profile: ProfileCreate):
    db: Session = SessionLocal()
    # Turn Pydantic model into your SQLAlchemy object
    db_profile = Profile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.get("/generate_plan/{user_id}")
def get_plan(user_id: int):
    db: Session = SessionLocal()
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Call your ML stub; pass in a dict
    plan = generate_meal_plan(profile.__dict__)
    return plan
