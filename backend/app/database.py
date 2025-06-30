from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
import random
import joblib
import pandas as pd
import numpy as np
import json
from sqlalchemy.types import TypeDecorator, TEXT
from datetime import datetime, timezone

# Custom JSON type for SQLite
class JSON(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value, dialect):
        if value is not None:
            value = json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            value = json.loads(value)
        return value

SQLALCHEMY_DATABASE_URL = "sqlite:///./nutricart.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define Profile model
class Profile(Base):
    __tablename__ = "profiles"
    user_id               = Column(Integer, primary_key=True, index=True)
    age                   = Column(Integer, nullable=False)
    weight                = Column(Float,   nullable=False)
    height                = Column(Float,   nullable=False)
    goal                  = Column(String,  nullable=False)
    budget                = Column(Float,   nullable=True)        # new
    dietary_restrictions  = Column(JSON,    nullable=True)        # new

# Define User model
class User(Base):
    __tablename__ = "users"
    id             = Column(Integer, primary_key=True, index=True)
    first_name     = Column(String, nullable=False)
    last_name      = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password= Column(String, nullable=False)
    is_active      = Column(Boolean, default=True)
    is_verified    = Column(Boolean, default=False)
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# Define MealPlan model
class MealPlan(Base):
    __tablename__ = "mealPlans"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=True)
    user_id  = Column(Integer, nullable=True)
    plan_json= Column(JSON, nullable=True)
    plan_ids = Column(String, nullable=True)  # Comma-separated recipe IDs
    created_at= Column(DateTime, nullable=True)

# Define Meal model
class Meal(Base):
    __tablename__ = "meals"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=True)
    ingredient_ids = Column(String, nullable=True)
    instructions   = Column(String, nullable=True)
    created_at     = Column(DateTime, nullable=True)

# Define Contact model
class Contact(Base):
    __tablename__ = "contacts"
    id          = Column(Integer, primary_key=True, index=True)
    first_name  = Column(String, nullable=False)
    last_name   = Column(String, nullable=False)
    email       = Column(String, nullable=False)
    phone       = Column(String, nullable=True)
    message     = Column(String, nullable=False)
    sms_consent = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Define Ingredient model
class Ingredient(Base):
    __tablename__ = "ingredients"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=True)
    created_at  = Column(DateTime, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

# Load ML artifacts
scaler  = joblib.load('scaler.pkl')
model   = joblib.load('meal_cluster_model.pkl')
recipes = pd.read_csv('recipes_with_clusters.csv')

def calculate_bmr(age, weight, height):
    return 10 * weight + 6.25 * height - 5 * age + 5

def adjust_tdee(bmr, goal):
    tdee = bmr * 1.2
    if goal == "lose":
        return tdee - 500
    if goal == "gain":
        return tdee + 300
    return tdee

def generate_meal_plan(profile_dict):
    # extract & compute
    bmr  = calculate_bmr(profile_dict["age"], profile_dict["weight"], profile_dict["height"])
    tdee = adjust_tdee(bmr, profile_dict["goal"])

    # macros & per-meal targets
    total_protein_g = (0.3 * tdee) / 4
    total_carbs_g   = (0.4 * tdee) / 4
    total_fat_g     = (0.3 * tdee) / 9
    target = np.array([[
        tdee/3,
        total_protein_g/3,
        total_carbs_g/3,
        total_fat_g/3
    ]])
    scaled_target = scaler.transform(target)

    # pick closest cluster
    dists = [np.linalg.norm(scaled_target - c) for c in model.cluster_centers_]
    cluster = int(np.argmin(dists))

    # filter recipes by cluster
    pool = recipes[recipes.cluster == cluster].copy()

    # apply dietary filters
    dietary = profile_dict.get("dietary_restrictions") or []
    for dr in dietary:
        pool = pool[~pool.name.str.contains(dr, case=False, na=False)]

    # sample or fallback
    weekly = []
    for day in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
        if len(pool) >= 3:
            chosen = pool.sample(3).to_dict('records')
        else:
            chosen = pool.to_dict('records')
            chosen += random.sample(MEAL_CATALOG, 3 - len(chosen))
        weekly.append({
            "day": day,
            "meals": [{"name": m["name"], "calories": m["calories"]} for m in chosen]
        })

    return {
        "user_id": profile_dict["user_id"],
        "budget": profile_dict.get("budget"),
        "dietary_restrictions": dietary,
        "weekly_plan": weekly
    }

MEAL_CATALOG = [
    {"name": "Oatmeal with Fruits",         "calories": 350},
    {"name": "Chicken Salad",               "calories": 450},
    {"name": "Grilled Salmon with Veggies", "calories": 600},
    {"name": "Turkey Sandwich",             "calories": 400},
    {"name": "Quinoa Bowl",                 "calories": 500},
    {"name": "Veggie Stir-fry",             "calories": 550},
    {"name": "Greek Yogurt with Nuts",      "calories": 300},
    {"name": "Protein Smoothie",            "calories": 250},
]
