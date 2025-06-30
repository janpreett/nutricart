from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from app.database import (
    init_db,
    SessionLocal,
    Profile,
    User,
    Contact,
    generate_meal_plan
)
from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user,
    get_db,
    get_user_by_email,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# --- Schemas ---------------------------------------------------------------

class ProfileCreate(BaseModel):
    age:    int
    weight: float
    height: float
    goal:   str
    budget:                Optional[float]     = None
    dietary_restrictions:  Optional[List[str]] = []

class ProfileResponse(ProfileCreate):
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class UserRegister(BaseModel):
    first_name: str
    last_name:  str
    email:      EmailStr
    password:   str

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type:   str

class UserResponse(BaseModel):
    id:          int
    first_name:  str
    last_name:   str
    email:       str
    is_active:   bool
    is_verified: bool
    model_config = ConfigDict(from_attributes=True)

class ContactCreate(BaseModel):
    first_name: str
    last_name:  str
    email:      EmailStr
    phone:      Optional[str] = None
    message:    str
    sms_consent: bool = False

class ContactResponse(ContactCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- App setup -------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="NutriCart API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "NutriCart backend up!"}

# --- Auth endpoints -------------------------------------------------------

@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user); db.commit(); db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token({"sub": db_user.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current: User = Depends(get_current_active_user)):
    return current

# --- Profile endpoints ----------------------------------------------------

@app.post("/profile", status_code=201, response_model=ProfileResponse)
def create_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_active_user)
):
    db = SessionLocal()
    existing = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    db_profile = Profile(
        user_id=current_user.id,
        age=data.age,
        weight=data.weight,
        height=data.height,
        goal=data.goal,
        budget=data.budget,
        dietary_restrictions=data.dietary_restrictions,
    )
    db.add(db_profile); db.commit(); db.refresh(db_profile)
    return db_profile

@app.get("/profile", response_model=ProfileResponse)
def read_profile(current_user: User = Depends(get_current_active_user)):
    db = SessionLocal()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# --- Meal‐plan endpoint ---------------------------------------------------

@app.get("/generate_plan/{user_id}")
def get_plan(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return generate_meal_plan(profile.__dict__)

# --- Contact endpoints ----------------------------------------------------

@app.post("/contact", response_model=ContactResponse, status_code=201)
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    db_contact = Contact(
        first_name=contact.first_name,
        last_name=contact.last_name,
        email=contact.email,
        phone=contact.phone,
        message=contact.message,
        sms_consent=contact.sms_consent
    )
    db.add(db_contact); db.commit(); db.refresh(db_contact)
    return db_contact
