from fastapi import APIRouter, HTTPException, Response
import csv
import io
import psycopg2
from psycopg2.extras import RealDictCursor
import os


DB_USER = "postgres"
DB_PASSWORD = "74568112"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "space_launch_library"

DATABASE_CONFIG = {
    "user": DB_USER,
    "password": DB_PASSWORD,
    "host": DB_HOST,
    "port": DB_PORT,
    "database": DB_NAME,
}

def get_db_connection():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    return conn

def get_launch_csv():
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = """SELECT * FROM spacexnumbers_frontend.launch
                       ORDER BY net desc;"""
            cur.execute(query)
            launches = cur.fetchall()  # Fetch all rows
            print(launches)
            column_names = [desc[0] for desc in cur.description]  # Get column names 
            print(column_names)

        data_rows = [tuple(row.values()) for row in launches]

        # Convert to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(column_names)  # Write header once
        writer.writerow(data_rows)  # Write each row
        
        csv_content = output.getvalue()
        output.close()

    
    except Exception as e:
        print(e)
    finally:
        conn.close()

get_launch_csv()