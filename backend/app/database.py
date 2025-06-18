from sqlalchemy import create_engine, Column, Integer, Float, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import random
import joblib
import pandas as pd
import numpy as np

SQLALCHEMY_DATABASE_URL = "sqlite:///./nutricart.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define Profile model
class Profile(Base):
    __tablename__ = "profiles"
    user_id = Column(Integer, primary_key=True, index=True)
    age     = Column(Integer, nullable=False)
    weight  = Column(Float,   nullable=False)
    height  = Column(Float,   nullable=False)
    goal    = Column(String,  nullable=False)
    dietry_preferences = Column(String, nullable=False)
    allergies = Column(String, nullable=True)
    created_at = Column(String, nullable=False) 

# Define User model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=False)
    username  = Column(String,   nullable=False)
    password  = Column(String,   nullable=False)
    securityQA_json = Column(JSON,  nullable=False)
    created_at = Column(DateTime,  nullable=False)

# Define MealPlan model
class MealPlan(Base):
    __tablename__ = "mealPlans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    plan_json = Column(JSON, nullable=False)
    plan_ids = Column(String, nullable=False)  # Comma-separated list of recipe IDs
    created_at = Column(DateTime,  nullable=False)

# Define Meal model
class Meal(Base):
    __tablename__ = "meals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ingredient_ids = Column(String, nullable=False)  # Comma-separated list of ingredient Ids
    instructions = Column(String, nullable=False)
    created_at = Column(DateTime,  nullable=False)

# Define Ingredient model
class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime,  nullable=False)

# Initialize database
def init_db():
    Base.metadata.create_all(bind=engine)

# Load the scaler, model, and recipes with clusters
scaler = joblib.load('scaler.pkl')
model = joblib.load('meal_cluster_model.pkl')
recipes = pd.read_csv('recipes_with_clusters.csv')

def calculate_bmr(age, weight, height):
    # Mifflin–St Jeor equation (male)
    return 10 * weight + 6.25 * height - 5 * age + 5

def adjust_tdee(bmr, goal):
    tdee = bmr * 1.2  # Sedentary activity factor
    if goal == "lose":
        return tdee - 500
    if goal == "gain":
        return tdee + 300
    return tdee

def generate_meal_plan(profile_dict):
    bmr = calculate_bmr(profile_dict["age"], profile_dict["weight"], profile_dict["height"])
    tdee = adjust_tdee(bmr, profile_dict["goal"])
    
    # Macro ratios: 40% carbs, 30% protein, 30% fat
    total_protein_cal = 0.3 * tdee
    total_carbs_cal = 0.4 * tdee
    total_fat_cal = 0.3 * tdee
    
    total_protein_g = total_protein_cal / 4  # 4 kcal/g for protein
    total_carbs_g = total_carbs_cal / 4      # 4 kcal/g for carbs
    total_fat_g = total_fat_cal / 9          # 9 kcal/g for fat
    
    # Per meal targets (3 meals/day)
    target_calories = tdee / 3
    target_protein = total_protein_g / 3
    target_carbs = total_carbs_g / 3
    target_fat = total_fat_g / 3
    
    # Create target nutritional vector
    target = np.array([[target_calories, target_protein, target_carbs, target_fat]])
    
    # Scale the target using the pre-trained scaler
    scaled_target = scaler.transform(target)
    
    # Find the closest cluster
    distances = [np.linalg.norm(scaled_target - center) for center in model.cluster_centers_]
    closest_cluster = np.argmin(distances)
    
    # Select recipes from the closest cluster
    suitable_recipes = recipes[recipes['cluster'] == closest_cluster]
    
    # Generate weekly meal plan
    weekly = []
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        if len(suitable_recipes) < 3:
            meals = suitable_recipes.to_dict('records')
            meals += random.sample(MEAL_CATALOG, 3 - len(meals))  # Fallback if not enough recipes
        else:
            meals = suitable_recipes.sample(3).to_dict('records')
        weekly.append({
            "day": day,
            "meals": [{"name": m["name"], "calories": m["calories"]} for m in meals]
        })
    return {"user_id": profile_dict["user_id"], "weekly_plan": weekly}

# Static meal catalog as fallback
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