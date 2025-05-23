from fastapi import FastAPI
from app.database import engine, Base


app = FastAPI(title="NutriCart API")

@app.get("/")
async def read_root():
    return {"message": "NutriCart(Group 3 CapStone Project) backend!"}
