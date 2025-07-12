from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from app.database import (
    init_db, SessionLocal, Profile, User, Contact,
    generate_meal_plan, pick_random_meal
)
from app.auth import (
    authenticate_user, create_access_token,
    get_password_hash, get_current_active_user,
    get_db, get_user_by_email, ACCESS_TOKEN_EXPIRE_MINUTES,
    update_user_password,
    save_security_questions, verify_security_answers,
    get_user_security_questions
)

# ── Schemas ────────────────────────────────────────────────────────────────
class ProfileCreate(BaseModel):
    age: int
    weight: float
    height: float
    goal: str
    budget: Optional[float] = None
    dietary_restrictions: Optional[List[str]] = []

class ProfileResponse(ProfileCreate):
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordVerifiedRequest(BaseModel):
    email: str
    password: str


class SecurityQuestionsRequest(BaseModel):
    security_questions: dict  # {"question1": "answer1", "question2": "answer2", "question3": "answer3"}


class SecurityAnswersRequest(BaseModel):
    email: str
    security_answers: dict  # {"question1": "answer1", "question2": "answer2", "question3": "answer3"}


class SecurityQuestionsResponse(BaseModel):
    questions: list[str]


class MessageResponse(BaseModel):
    message: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    is_active: bool
    is_verified: bool
    model_config = ConfigDict(from_attributes=True)

class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    sms_consent: bool = False

class ContactResponse(ContactCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

# —— new schema for swapping one meal ——
class SwapRequest(BaseModel):
    day_index:  int  # 0-based (Mon=0)
    meal_index: int  # 0,1,2

# ── App setup ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="NutriCart API",
    lifespan=lifespan,
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "NutriCart backend up!"}

# ── Auth ───────────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=get_password_hash(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        {"sub": db_user.email},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(current: User = Depends(get_current_active_user)):
    return current


@app.post("/auth/security-questions", response_model=MessageResponse)
def save_user_security_questions(
    request: SecurityQuestionsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if len(request.security_questions) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exactly 3 security questions are required"
        )
    
    success = save_security_questions(db, current_user.id, request.security_questions)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save security questions"
        )
    
    return {"message": "Security questions saved successfully"}


@app.get("/auth/my-security-questions", response_model=SecurityQuestionsResponse)
def get_current_user_security_questions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    questions = get_user_security_questions(db, current_user.id)
    return {"questions": questions}


@app.post("/auth/get-security-questions", response_model=SecurityQuestionsResponse)
def get_security_questions_for_reset(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )
    
    questions = get_user_security_questions(db, user.id)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has not set up security questions yet. Please contact support or try logging in to set them up."
        )
    
    return {"questions": questions}


@app.post("/auth/verify-security-answers", response_model=MessageResponse)
def verify_security_questions(request: SecurityAnswersRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify security answers
    if not verify_security_answers(db, user.id, request.security_answers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect security answers"
        )

    return {"message": "Security answers verified successfully. You can now reset your password."}


@app.post("/auth/reset-password-verified", response_model=MessageResponse)
def reset_password_after_verification(request: ResetPasswordVerifiedRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update the password
    success = update_user_password(db, user.id, request.password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password has been reset successfully"}

# ── Profile (POST = up-sert) ───────────────────────────────────────────────
@app.post("/profile", response_model=ProfileResponse)
def upsert_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
):
    db: Session = SessionLocal()
    db_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if db_profile:                              # update
        for k, v in data.model_dump().items():
            setattr(db_profile, k, v)
        db.commit(); db.refresh(db_profile)
        return db_profile

    new_prof = Profile(user_id=current_user.id, **data.model_dump())
    db.add(new_prof); db.commit(); db.refresh(new_prof)
    return new_prof

@app.get("/profile", response_model=ProfileResponse)
def read_profile(current_user: User = Depends(get_current_active_user)):
    db = SessionLocal()
    prof = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found")
    return prof

# ── Meal-plan & swap ───────────────────────────────────────────────────────
@app.get("/generate_plan/{user_id}")
def get_plan(
    user_id: int, current_user: User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db = SessionLocal()
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    plan = generate_meal_plan(profile.__dict__)
    return JSONResponse(content=plan)

@app.post("/swap_meal/{user_id}")
def swap_meal(
    user_id: int, req: SwapRequest,
    current_user: User = Depends(get_current_active_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")
    db = SessionLocal()
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    meal = pick_random_meal(profile.__dict__)
    # frontend performs the in-memory replacement
    return meal

# ── Contact ────────────────────────────────────────────────────────────────
@app.post("/contact", response_model=ContactResponse, status_code=201)
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    db_contact = Contact(**contact.model_dump())
    db.add(db_contact); db.commit(); db.refresh(db_contact)
    return db_contact
