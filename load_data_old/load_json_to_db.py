import json
import os
import psycopg2
from dotenv import load_dotenv
import os

def get_json_files(directory):
    json_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                json_files.append(os.path.join(root, file))
    return json_files

# Assuming 'overall_folder' is the path to your main directory
overall_folder = '../spacex_detailed_launches_json'
json_files = get_json_files(overall_folder)

print(f"Found {len(json_files)} JSON files in {overall_folder}")

# Load environment variables
load_dotenv()

password = os.getenv('POSTGRES_PASSWORD')
if not password:
    raise ValueError("Database password not found in environment variables")

db_config = {
    'dbname': 'space_launch_library',
    'user': 'postgres',
    'host': 'localhost',
    'password': password
}

conn = psycopg2.connect(**db_config)
cur = conn.cursor()

try:
    batch_size = 100
    for i, file_path in enumerate(json_files, 1):

        with open(file_path, 'r') as file:

            json_data = json.load(file)
            # Use the file name without directory path as the id
            file_name = os.path.splitext(os.path.basename(file_path))[0]

            cur.execute("INSERT INTO space_launch_library_json.spacex_detailed_launches (id, data) VALUES (%s, %s);", 
                        (file_name, json.dumps(json_data)))

            if i % batch_size == 0:
                conn.commit()
                print(f"{i} JSON files inserted")

    conn.commit()  # Final commit for any remaining inserts

    print(f"{len(json_files)} JSON files inserted successfully into the spacex_detailed_launches table.")

except (Exception, psycopg2.Error) as error:
    print("Error inserting JSON data:", error)
    conn.rollback()  # Rollback in case there is any error

finally:
    # Closing database connection.
    if conn:
        cur.close()
        conn.close()
        print("PostgreSQL connection is closed")