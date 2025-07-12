from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import SessionLocal, User

# Security configuration
SECRET_KEY = "secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token authentication
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except InvalidTokenError:
        return None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(credentials.credentials)
    if email is None:
        raise credentials_exception
    
    user = get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def update_user_password(db: Session, user_id: int, new_password: str) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    user.hashed_password = get_password_hash(new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return True


def save_security_questions(db: Session, user_id: int, security_qa: dict) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    # Hash the answers for security
    hashed_qa = {}
    for question, answer in security_qa.items():
        hashed_qa[question] = get_password_hash(answer.lower().strip())
    
    user.security_qa_json = hashed_qa
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return True


def verify_security_answers(db: Session, user_id: int, provided_answers: dict) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.security_qa_json:
        return False
    
    stored_qa = user.security_qa_json
    
    # Check if all questions are answered correctly
    for question, provided_answer in provided_answers.items():
        if question not in stored_qa:
            return False
        
        stored_hash = stored_qa[question]
        if not verify_password(provided_answer.lower().strip(), stored_hash):
            return False
    
    return True


def get_user_security_questions(db: Session, user_id: int) -> list:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.security_qa_json:
        return []
    
    return list(user.security_qa_json.keys())
