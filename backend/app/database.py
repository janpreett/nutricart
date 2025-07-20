from __future__ import annotations

# ---------- stdlib ---------------------------------------------------------
import json
import random
from   datetime import datetime, timezone

# ---------- 3rd-party ------------------------------------------------------
import joblib
import numpy  as np
import pandas as pd
from   sqlalchemy import (
    create_engine, Column, Integer, Float, String,
    DateTime, Boolean
)
from   sqlalchemy.orm  import sessionmaker, declarative_base
from   sqlalchemy.types import TypeDecorator, TEXT

# ---------------------------------------------------------------------------
# DB INITIALISATION
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite:///./nutricart.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)
Base = declarative_base()

# ---------------------------------------------------------------------------
# Custom JSON type (works with SQLite which lacks native JSON)
# ---------------------------------------------------------------------------

class JSON(TypeDecorator):
    impl = TEXT  # store as TEXT

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return json.loads(value) if value is not None else None

# ---------------------------------------------------------------------------
# ORM MODELS
# ---------------------------------------------------------------------------

class Profile(Base):
    __tablename__ = "profiles"

    user_id              = Column(Integer, primary_key=True, index=True)
    age                  = Column(Integer, nullable=False)
    weight               = Column(Float,   nullable=False)  # kg
    height               = Column(Float,   nullable=False)  # cm
    goal                 = Column(String,  nullable=False)  # maintain | lose | gain
    budget               = Column(Float,   nullable=True)   # weekly $ budget
    dietary_restrictions = Column(JSON,    nullable=True)   # list[str]


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    first_name      = Column(String, nullable=False)
    last_name       = Column(String, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    security_qa_json = Column(JSON, nullable=True)  # Store security questions and answers
    is_active       = Column(Boolean, default=True)
    is_verified     = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class MealPlan(Base):
    __tablename__ = "mealPlans"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=True)
    user_id    = Column(Integer, nullable=True)
    plan_json  = Column(JSON, nullable=True)
    plan_ids   = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


class Meal(Base):
    __tablename__ = "meals"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=True)
    ingredient_ids = Column(String, nullable=True)
    instructions   = Column(String, nullable=True)
    created_at     = Column(DateTime, nullable=True)


class Contact(Base):
    __tablename__ = "contacts"

    id          = Column(Integer, primary_key=True, index=True)
    first_name  = Column(String,  nullable=False)
    last_name   = Column(String,  nullable=False)
    email       = Column(String,  nullable=False)
    phone       = Column(String,  nullable=True)
    message     = Column(String,  nullable=False)
    sms_consent = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Ingredient(Base):
    __tablename__ = "ingredients"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


def init_db() -> None:
    """Create tables on first start-up."""
    Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# ML artefacts & recipe catalogue
# ---------------------------------------------------------------------------

scaler  = joblib.load("scaler.pkl")               # fitted on 5 columns
model   = joblib.load("meal_cluster_model.pkl")   # KMeans(n_clusters=10)
recipes = pd.read_csv("recipes_with_clusters.csv")
# columns: name calories protein carbs fat price cluster

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def calculate_bmr(age: int, weight: float, height: float) -> float:
    """Mifflin–St Jeor BMR (male)."""
    return 10 * weight + 6.25 * height - 5 * age + 5


def adjust_tdee(bmr: float, goal: str) -> float:
    """Apply sedentary multiplier and goal offset."""
    tdee = bmr * 1.2
    if goal == "lose":
        tdee -= 500
    elif goal == "gain":
        tdee += 300
    return tdee


def _py(v):
    """Convert pandas / NumPy scalars to regular Python types."""
    if pd.isna(v):
        return None
    if isinstance(v, (np.generic,)):
        return v.item()
    return v


def apply_dietary_restrictions(pool: pd.DataFrame, restrictions: list[str]) -> pd.DataFrame:
    """
    Apply dietary restriction filters intelligently.
    """
    if not restrictions or pool.empty:
        return pool
    
    filtered = pool.copy()
    
    for restriction in restrictions:
        restriction_lower = restriction.lower()
        
        if restriction_lower == "vegetarian":
            # Exclude common meat items
            meat_keywords = [
                'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck',
                'bacon', 'sausage', 'meatball', 'steak', 'ham', 'salami',
                'shrimp', 'salmon', 'cod', 'tuna', 'fish'
            ]
            for keyword in meat_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "vegan":
            # Exclude all animal products
            animal_keywords = [
                'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck',
                'bacon', 'sausage', 'meatball', 'steak', 'ham', 'salami',
                'shrimp', 'salmon', 'cod', 'tuna', 'fish',
                'egg', 'milk', 'cheese', 'yogurt', 'butter', 'cream',
                'mozzarella', 'cheddar', 'parmesan', 'feta', 'cottage cheese'
            ]
            for keyword in animal_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "dairy-free":
            # Exclude dairy products
            dairy_keywords = [
                'milk', 'cheese', 'yogurt', 'butter', 'cream',
                'mozzarella', 'cheddar', 'parmesan', 'feta', 'cottage cheese'
            ]
            for keyword in dairy_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "gluten-free":
            # Exclude gluten-containing items
            gluten_keywords = [
                'bread', 'pasta', 'spaghetti', 'noodles', 'wrap',
                'sandwich', 'toast', 'waffle', 'pancake'
            ]
            for keyword in gluten_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "nut-free":
            # Exclude nuts
            nut_keywords = ['peanut', 'almond', 'walnut', 'cashew', 'pecan', 'nut']
            for keyword in nut_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "halal":
            # Exclude pork and alcohol
            haram_keywords = ['pork', 'bacon', 'ham', 'wine', 'beer']
            for keyword in haram_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
                
        elif restriction_lower == "kosher":
            # Basic kosher restrictions
            non_kosher_keywords = ['pork', 'bacon', 'ham', 'shrimp', 'lobster', 'crab']
            for keyword in non_kosher_keywords:
                filtered = filtered[~filtered.name.str.contains(keyword, case=False, na=False)]
    
    return filtered

# ---------------------------------------------------------------------------
# MEAL-PLAN GENERATION
# ---------------------------------------------------------------------------

def generate_meal_plan(profile: dict) -> dict:
    """
    High-level steps
    ----------------
    1. Compute per-meal calorie & macro targets
    2. Include **price target** so scaler sees 5 features
    3. Choose closest K-Means cluster
    4. Filter pool by cluster, diet, and budget
    5. Sample three meals per day (fallback to static catalogue)
    """

    # 1 ▸ energy & macros ----------------------------------------------------
    bmr  = calculate_bmr(profile["age"], profile["weight"], profile["height"])
    tdee = adjust_tdee(bmr, profile["goal"])

    kcal_target     = tdee / 3
    protein_target  = (0.30 * tdee / 4) / 3
    carbs_target    = (0.40 * tdee / 4) / 3
    fat_target      = (0.30 * tdee / 9) / 3

    # 2 ▸ price target -------------------------------------------------------
    weekly_budget      = profile.get("budget")
    avg_price_per_meal = (
        weekly_budget / 21 if weekly_budget else recipes["price"].mean()
    )

    target = np.array([[
        kcal_target, protein_target, carbs_target, fat_target, avg_price_per_meal
    ]])
    scaled_target = scaler.transform(target)

    # 3 ▸ nearest cluster ----------------------------------------------------
    cluster = int(np.argmin([
        np.linalg.norm(scaled_target - c) for c in model.cluster_centers_
    ]))
    pool = recipes[recipes.cluster == cluster].copy()

    # 4a ▸ diet filter -------------------------------------------------------
    pool = apply_dietary_restrictions(pool, profile.get("dietary_restrictions", []))

    # 4b ▸ budget filter (±20 % wiggle) -------------------------------------
    budget_ceiling = avg_price_per_meal * 1.20
    pool = pool[pool.price <= budget_ceiling]

    # 5 ▸ daily sampling -----------------------------------------------------
    weekly_plan: list[dict] = []
    for day in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
        if len(pool) >= 3:
            chosen = pool.sample(3).to_dict("records")
        else:
            # Fallback to static catalog with complete meal data
            chosen = random.sample(MEAL_CATALOG, 3)
        
        # Ensure all meals have complete nutrition data
        meals = []
        for m in chosen:
            meal_dict = {
                "name": str(m.get("name", "Unknown Meal")),
                "calories": int(_py(m.get("calories", 500))),
                "protein": float(_py(m.get("protein", 20))),
                "carbs": float(_py(m.get("carbs", 50))),
                "fat": float(_py(m.get("fat", 15))),
                "price": float(_py(m.get("price", 8.00)))
            }
            meals.append(meal_dict)
            
        weekly_plan.append({
            "day": day,
            "meals": meals
        })

    return {
        "user_id":              profile["user_id"],
        "weekly_budget":        weekly_budget,
        "avg_price_per_meal":   round(avg_price_per_meal, 2),
        "dietary_restrictions": profile.get("dietary_restrictions", []),
        "weekly_plan":          weekly_plan,
    }

# ---------------------------------------------------------------------------
# ONE-MEAL PICKER  – used by /swap_meal
# ---------------------------------------------------------------------------

def pick_random_meal(profile: dict) -> dict:
    """Return ONE meal that fits the user's cluster, diet & budget."""
    bmr  = calculate_bmr(profile["age"], profile["weight"], profile["height"])
    tdee = adjust_tdee(bmr, profile["goal"])

    target = np.array([[
        tdee / 3,
        (0.30 * tdee / 4) / 3,
        (0.40 * tdee / 4) / 3,
        (0.30 * tdee / 9) / 3,
        (profile.get("budget") or recipes["price"].mean()) / 21,
    ]])
    cluster = int(np.argmin([
        np.linalg.norm(scaler.transform(target) - c)
        for c in model.cluster_centers_
    ]))

    pool = recipes[recipes.cluster == cluster].copy()

    # Apply dietary restrictions
    pool = apply_dietary_restrictions(pool, profile.get("dietary_restrictions", []))

    # Apply budget filter
    if profile.get("budget"):
        pool = pool[pool.price <= profile["budget"] / 21]

    if pool.empty:
        # Return a complete meal from the static catalog
        choice = random.choice(MEAL_CATALOG)
        return choice

    # Select a random meal and ensure all fields are present
    m = pool.sample(1).iloc[0]
    return {
        "name":     str(m.get("name", "Unknown Meal")),
        "calories": int(_py(m.get("calories", 500))),
        "protein":  float(_py(m.get("protein", 20))),
        "carbs":    float(_py(m.get("carbs", 50))),
        "fat":      float(_py(m.get("fat", 15))),
        "price":    float(_py(m.get("price", 8.00)))
    }

# ---------------------------------------------------------------------------
# Static fallback catalogue - NOW WITH COMPLETE NUTRITION DATA
# ---------------------------------------------------------------------------

MEAL_CATALOG = [
    {"name": "Oatmeal with Fruits",         "calories": 350, "price": 5.00,  "protein": 8,  "carbs": 65, "fat": 7},
    {"name": "Tofu Stir Fry",               "calories": 410, "price": 7.50,  "protein": 22, "carbs": 40, "fat": 18},
    {"name": "Quinoa Bowl",                 "calories": 500, "price": 8.00,  "protein": 25, "carbs": 50, "fat": 20},
    {"name": "Veggie Stir-fry with Tofu",   "calories": 440, "price": 7.00,  "protein": 25, "carbs": 35, "fat": 20},
    {"name": "Greek Yogurt with Berries",   "calories": 300, "price": 4.50,  "protein": 20, "carbs": 25, "fat": 10},
    {"name": "Protein Smoothie",            "calories": 250, "price": 5.50,  "protein": 20, "carbs": 10, "fat": 8},
    {"name": "Black Bean Tacos",            "calories": 410, "price": 6.00,  "protein": 22, "carbs": 40, "fat": 14},
    {"name": "Vegan Buddha Bowl",           "calories": 510, "price": 9.00,  "protein": 22, "carbs": 55, "fat": 18},
]