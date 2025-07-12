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
    for dr in profile.get("dietary_restrictions") or []:
        pool = pool[~pool.name.str.contains(dr, case=False, na=False)]

    # 4b ▸ budget filter (±20 % wiggle) -------------------------------------
    budget_ceiling = avg_price_per_meal * 1.20
    pool = pool[pool.price <= budget_ceiling]

    # 5 ▸ daily sampling -----------------------------------------------------
    weekly_plan: list[dict] = []
    for day in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
        chosen = (
            pool.sample(3).to_dict("records")
            if len(pool) >= 3 else random.sample(MEAL_CATALOG, 3)
        )
        weekly_plan.append({
            "day": day,
            "meals": [
                {"name": m["name"], "calories": m["calories"], "price": m["price"]}
                for m in chosen
            ]
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

def _py(v):
    """Convert pandas / NumPy scalars to regular Python types."""
    if pd.isna(v):
        return None
    if isinstance(v, (np.generic,)):
        return v.item()
    return v


def pick_random_meal(profile: dict) -> dict:
    """Return ONE meal that fits the user’s cluster, diet & budget."""
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

    for dr in profile.get("dietary_restrictions") or []:
        pool = pool[~pool.name.str.contains(dr, case=False, na=False)]

    if profile.get("budget"):
        pool = pool[pool.price <= profile["budget"] / 21]

    if pool.empty:
        choice = random.choice(MEAL_CATALOG)
        return {**choice, "protein": None, "carbs": None, "fat": None}

    m = pool.sample(1).iloc[0]
    return {
        "name":     str(m.name),
        "calories": int(_py(m.calories)),
        "price":    float(_py(m.price)),
        "protein":  _py(getattr(m, "protein", None)),
        "carbs":    _py(getattr(m, "carbs",   None)),
        "fat":      _py(getattr(m, "fat",     None)),
    }

# ---------------------------------------------------------------------------
# Static fallback catalogue
# ---------------------------------------------------------------------------

MEAL_CATALOG = [
    {"name": "Oatmeal with Fruits",         "calories": 350, "price": 5.00},
    {"name": "Chicken Salad",               "calories": 450, "price": 7.50},
    {"name": "Grilled Salmon with Veggies", "calories": 600, "price": 12.00},
    {"name": "Turkey Sandwich",             "calories": 400, "price": 6.00},
    {"name": "Quinoa Bowl",                 "calories": 500, "price": 8.00},
    {"name": "Veggie Stir-fry",             "calories": 550, "price": 7.00},
    {"name": "Greek Yogurt with Nuts",      "calories": 300, "price": 4.50},
    {"name": "Protein Smoothie",            "calories": 250, "price": 5.50},
]
