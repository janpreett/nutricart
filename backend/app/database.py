from sqlalchemy import create_engine, Column, Integer, Float, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import random

SQLALCHEMY_DATABASE_URL = "sqlite:///./nutricart.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 1) Define your Profile model
class Profile(Base):
    __tablename__ = "profiles"
    user_id = Column(Integer, primary_key=True, index=True)
    age     = Column(Integer, nullable=False)
    weight  = Column(Float,   nullable=False)
    height  = Column(Float,   nullable=False)
    goal    = Column(String,  nullable=False)

# 2) init_db helper
def init_db():
    Base.metadata.create_all(bind=engine)

# 3) Simple nutrition catalog and ML stub
MEAL_CATALOG = [
    {"name": "Oatmeal with Fruits",         "calories": 350},
    {"name": "Chicken Salad",                "calories": 450},
    {"name": "Grilled Salmon with Veggies",  "calories": 600},
    {"name": "Turkey Sandwich",              "calories": 400},
    {"name": "Quinoa Bowl",                  "calories": 500},
    {"name": "Veggie Stir-fry",              "calories": 550},
    {"name": "Greek Yogurt with Nuts",       "calories": 300},
    {"name": "Protein Smoothie",             "calories": 250},
]

def calculate_bmr(age, weight, height):
    # Mifflin–St Jeor (male)
    return 10 * weight + 6.25 * height - 5 * age + 5

def adjust_tdee(bmr, goal):
    tdee = bmr * 1.2  # sedentary factor
    if goal == "lose":
        return tdee - 500
    if goal == "gain":
        return tdee + 300
    return tdee

def generate_meal_plan(profile_dict):
    """Rule-based weekly plan approximating per-meal calories."""
    bmr = calculate_bmr(profile_dict["age"],
                        profile_dict["weight"],
                        profile_dict["height"])
    tdee = adjust_tdee(bmr, profile_dict["goal"])
    # pick 3 random meals/day
    weekly = []
    for day in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
        meals = random.sample(MEAL_CATALOG, 3)
        weekly.append({
          "day": day,
          "meals": [{"name": m["name"], "calories": m["calories"]} for m in meals]
        })
    return {"user_id": profile_dict["user_id"], "weekly_plan": weekly}
