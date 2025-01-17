from fastapi import APIRouter, HTTPException
from app.db import get_db_connection

router = APIRouter()

from contextlib import closing

@router.get("/last_refresh")
def get_last_refresh():
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                query = """SELECT * FROM spacexnumbers_frontend.last_refresh;"""
                cur.execute(query)
                data = cur.fetchall()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
