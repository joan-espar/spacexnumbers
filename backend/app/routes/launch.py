from fastapi import APIRouter, HTTPException
from app.db import get_db_connection

router = APIRouter()

from contextlib import closing

@router.get("/launch")
def get_launch():
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                query = """SELECT * FROM spacexnumbers_frontend.launch
                        ORDER BY net desc;"""
                cur.execute(query)
                data = cur.fetchall()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
