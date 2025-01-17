from fastapi import APIRouter, HTTPException
from app.db import get_db_connection

router = APIRouter()

from contextlib import closing

@router.get("/totals")
def get_totals():
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                query = """SELECT * FROM spacexnumbers_frontend.totals;"""
                cur.execute(query)
                data = cur.fetchall()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
