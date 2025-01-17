import os
import psycopg2
import json
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve the password and host from environment variables
password = os.getenv('POSTGRES_PASSWORD')
if not password:
    raise ValueError("Database password not found in environment variables")

host = os.getenv('POSTGRES_HOST')
if not host:
    raise ValueError("Database host not found in environment variables")

# Connection parameters
db_info = {
    'dbname': 'space_launch_library',
    'user': 'postgres',
    'host': host,
    'password': password
}

DELAY = 10 # 240  # 240 seconds (4 minutes) between API calls
LIMIT = 100

def update_previous_launches():
    url = "https://ll.thespacedevs.com/2.2.0/launch/previous/?sort=-net"
    params = {'limit': LIMIT, 'sort': '-net'}  # Maximum number of results per page

    # Load existing launch IDs from data base
    conn = psycopg2.connect(**db_info)

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM space_launch_library_json.previous_launches;")
            existing_ids = {row[0] for row in cur.fetchall()}

    except (Exception, psycopg2.Error) as error:
            print("Error:", error)
            conn.rollback()  # Rollback in case of error
    finally:
        # Close the database connection
        if conn:
            conn.close()

    new_launches = 0 # Count of new launches added
    new_spacex_launches = 0 # Count of new launches by spacex
    offset = 0  # For pagination

    while True:
        # Fetch a batch of launches from the API
        params['offset'] = offset
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            previous_launches = data.get('results', [])  # Extract the results list
        except requests.RequestException as e:
            print(f"API request failed: {e}")
            break

        new_rows = []
        for previous_launch in previous_launches:
            if previous_launch['id'] not in existing_ids:
                new_rows.append((
                    previous_launch['id'],
                    json.dumps(previous_launch)
                ))
                existing_ids.add(previous_launch['id'])  # Add to the set to avoid duplicates in this run

        if new_rows:
            try:
                conn = psycopg2.connect(**db_info)
                with conn.cursor() as cur:
                    insert_query = """
                        INSERT INTO space_launch_library_json.previous_launches
                        (id, data)
                        VALUES (%s, %s);
                    """
                    cur.executemany(insert_query, new_rows)
                    conn.commit()
                    new_launches += len(new_rows)
                    for row in new_rows:
                        parsed_data = json.loads(row[1])
                        launch_service_provider_name = parsed_data["launch_service_provider"]["name"]
                        if launch_service_provider_name == "SpaceX":
                            new_spacex_launches += 1
                    print(f"Inserted {new_launches} new launches, {new_spacex_launches} of which are from SpaceX.")

            except (Exception, psycopg2.Error) as error:
                print("Error inserting data:", error)
                if conn:
                    conn.rollback()
            finally:
                if conn:
                    conn.close()

        # Stop if the batch size is less than LIMIT
        if len(new_rows) < LIMIT:
            print("No more new launches to add.")
            break

        # Move to the next batch
        offset += LIMIT

    print(f"Total new launches added: {new_launches}")
    print(f"Total SpaceX launches added: {new_spacex_launches}")
    return new_launches, new_spacex_launches

def update_spacex_detailed_launches():
    api_base_url = "https://ll.thespacedevs.com/2.2.0/launch/"

    # Load existing previous launches form the database
    conn = psycopg2.connect(**db_info)

    missing_ids = []

    try:
        with conn.cursor() as cur:
            # Step 1: Get SpaceX launches from `previous_launches`
            query_spacex_launches = """
                SELECT id 
                FROM space_launch_library_json.previous_launches
                WHERE data->'launch_service_provider'->>'name' = 'SpaceX';
            """
            cur.execute(query_spacex_launches)
            spacex_ids = {row[0] for row in cur.fetchall()}  # Store SpaceX IDs in a set
            
            # Step 2: Get all IDs from `spacex_detailed_launches`
            query_detailed_launches = """
                SELECT id 
                FROM space_launch_library_json.spacex_detailed_launches;
            """
            cur.execute(query_detailed_launches)
            detailed_ids = {row[0] for row in cur.fetchall()}  # Store detailed launch IDs in a set
            
            # Step 3: Find IDs in `spacex_ids` but not in `detailed_ids`
            missing_ids = list(spacex_ids - detailed_ids)
            print(f"Missing SpaceX IDs: {missing_ids}")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        return []
    finally:
        if conn:
            conn.close()
            print("PostgreSQL connection is closed")

    if missing_ids:
        conn = psycopg2.connect(**db_info)
        
        try:
            with conn.cursor() as cur:
                for launch_id in missing_ids:
                    detailed_url = f"{api_base_url}{launch_id}/"

                    try:
                        # Fetch detailed data from the API
                        response = requests.get(detailed_url)
                        response.raise_for_status()
                        detailed_data = response.json()

                        # Prepare the insertion query
                        insert_query = """
                            INSERT INTO space_launch_library_json.spacex_detailed_launches (id, data)
                            VALUES (%s, %s);
                        """

                        # Insert into the database
                        cur.execute(insert_query, (launch_id, json.dumps(detailed_data)))
                        conn.commit()  # Commit after each successful insert
                        print(f"Saved detailed data for launch {launch_id}")

                        # Delay to respect API rate limits
                        time.sleep(DELAY)

                    except requests.exceptions.RequestException as e:
                        print(f"Error fetching detailed data for launch {launch_id}: {e}")
                    except psycopg2.Error as e:
                        print(f"Database error for launch {launch_id}: {e}")
                        conn.rollback()  # Rollback if there's a database error

        except Exception as e:
            print(f"Error during processing: {e}")
        finally:
            if conn:
                conn.close()
                print("PostgreSQL connection is closed")

    print("Finished fetching detailed launch data")

if __name__ == "__main__":
    # UPDATE PREVIOUS LAUNCHES
    new_launches, new_spacex_launches = update_previous_launches()
    
    if new_spacex_launches > 0:
        # GET DETAILED INFORMATION FOR THE SPACEX LAUNCHES
        update_spacex_detailed_launches()