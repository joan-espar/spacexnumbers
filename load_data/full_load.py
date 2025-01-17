import time
import os
import json
import requests
import time
from datetime import datetime
from dotenv import load_dotenv
import os
import psycopg2
import pandas as pd
from dateutil.relativedelta import relativedelta
import numpy as np
from sqlalchemy import create_engine

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
    'password': password,
    'port': 5432
}

DELAY = 1 # 240  # 240 seconds (4 minutes) between API calls
LIMIT = 100

### READ DATA FROM LAUNCH LIBRARY API AND SAVE IT TO OUR DATABASE AS JSON ###

def spacex_not_completed_launches():
    # Check if there are any SpaceX launches that are not completed and update the data 
    # in previous launches, detailed launcehs and all tables of the spacex rel db.
    conn = psycopg2.connect(**db_info)

    detailed_base_url = "https://ll.thespacedevs.com/2.2.0/launch/"

    not_completed_launches = []

    try:
        with conn.cursor() as cur:
            query_spacex_launches = """
                SELECT id 
                FROM space_launch_library_json.previous_launches
                WHERE data->'launch_service_provider'->>'name' = 'SpaceX' 
                AND data->'status'->>'abbrev' not in ('Success', 'Failure', 'Partial Failure');
            """
            cur.execute(query_spacex_launches)
            not_completed_launches = {row[0] for row in cur.fetchall()} 

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        return []
    finally:
        if conn:
            conn.close()

    updated_launches = 0 # Count of updated launches

    if not_completed_launches:
        conn = psycopg2.connect(**db_info)

        try:
            with conn.cursor() as cur:
                for launch_id in not_completed_launches:
                    detailed_url = f"{detailed_base_url}{launch_id}/"
                    try:
                        # Fetch detailed data from the API
                        response = requests.get(detailed_url)
                        response.raise_for_status()
                        data = response.json()

                        # Chech that the status is cmpleted (is in Success, Failure, Partial Failure)
                        if data['status']['abbrev'] not in ('Success', 'Failure', 'Partial Failure'):
                            print(f"Launch {launch_id} is still not completed.")
                            continue

                        # Prepare the insertion query
                        insert_query_previous = """
                            INSERT INTO space_launch_library_json.previous_launches (id, data)
                            VALUES (%s, %s)
                            ON CONFLICT (id) DO UPDATE
                            SET data = EXCLUDED.data;
                        """
                        insert_query_detailed = """
                            INSERT INTO space_launch_library_json.spacex_detailed_launches (id, data)
                            VALUES (%s, %s)
                            ON CONFLICT (id) DO UPDATE
                            SET data = EXCLUDED.data;
                        """

                        # Insert into the database
                        cur.execute(insert_query_previous, (launch_id, json.dumps(data)))
                        conn.commit()  # Commit after each successful insert
                        print(f"Saved previous data for launch {launch_id}")

                        cur.execute(insert_query_detailed, (launch_id, json.dumps(data)))
                        conn.commit()  # Commit after each successful insert
                        print(f"Saved detailed data for launch {launch_id}")

                        updated_launches += 1

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

    return updated_launches

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

    print("Finished fetching detailed launch data")


### READ DATA FROM PUR DATABASE AND SAVE IT TO OUR DATABASE AS TABLES ###

def fetch_detailed_data():
    query = "SELECT data FROM space_launch_library_json.spacex_detailed_launches;"
    detailed_data = []

    # Connect to the database   
    conn = psycopg2.connect(**db_info)
    cur = conn.cursor()

    try:
        # Use a single cursor for fetching data
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            for row in rows:
                detailed_data.append( row[0] )
        
        print("Detailed data loaded: updating tables...")

    except (Exception, psycopg2.Error) as error:
        print("Error fetching data:", error)
    
    finally:
        if conn:
            conn.close()

    return detailed_data

def get_launches(detailed_data):
    launch_data = []

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            # Extract specific fields
            launch_data.append([
                row.get('id', ''),
                row.get('net', ''),
                row.get('name', ''),
                row.get('status', {}).get('id', ''),
                row.get('launch_service_provider', {}).get('id', ''),
                row.get('rocket', {}).get('id', ''),
                row.get('mission', {}).get('id', '') if row.get('mission') else '',
                row.get('pad', {}).get('id', '')
            ])

        # Sort data by 'net' in descending order
        launch_data.sort(key=lambda x: x[1], reverse=True)

        upsert_query = """
            INSERT INTO spacex.launch 
            (id, net, name, status_id, launch_service_provider_id, rocket_id, mission_id, pad_id) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                net = EXCLUDED.net,
                name = EXCLUDED.name,
                status_id = EXCLUDED.status_id,
                launch_service_provider_id = EXCLUDED.launch_service_provider_id,
                rocket_id = EXCLUDED.rocket_id,
                mission_id = EXCLUDED.mission_id,
                pad_id = EXCLUDED.pad_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in launch_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the launch table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_configuration(detailed_data):
    configurations = {}

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            config = row.get('rocket', {}).get('configuration', {})
            if config:
                config_id = config.get('id')
                if config_id and config_id not in configurations:
                    configurations[config_id] = [
                        config_id,
                        config.get('name', ''),
                        config.get('active', ''),
                        config.get('reusable', ''),
                        config.get('family', ''),
                        config.get('full_name', ''),
                        config.get('variant', '')
                    ]

        configuration_data = list(configurations.values())
        configuration_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.configuration 
            (id, name, active, reusable, family, full_name, variant) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                active = EXCLUDED.active,
                reusable = EXCLUDED.reusable,
                family = EXCLUDED.family,
                full_name = EXCLUDED.full_name,
                variant = EXCLUDED.variant;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in configuration_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the configuration table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_rocket_configuration(detailed_data):
    rocket_configuration_data = []

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            # print(row)
            rocket = row.get('rocket', {})
            configuration = rocket.get('configuration', {})

            if rocket and configuration:
                rocket_configuration_data.append([rocket.get('id', ''), configuration.get('id', '')])

        rocket_configuration_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.rocket_configuration 
            (rocket_id, configuration_id) 
            VALUES (%s, %s)
            ON CONFLICT (rocket_id) 
            DO UPDATE SET 
                configuration_id = EXCLUDED.configuration_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in rocket_configuration_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the rocket_configuration table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_status(detailed_data):
    statuses = {}

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            status = row.get('status', {})
            if status:
                status_id = status.get('id')
                if status_id not in statuses:
                    statuses[status_id] = [
                        status_id,
                        status.get('name', ''),
                        status.get('abbrev', ''),
                        status.get('description', '')
                    ]

        status_data = list(statuses.values())
        status_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.status 
            (id, name, abbrev, description) 
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                abbrev = EXCLUDED.abbrev,
                description = EXCLUDED.description;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in status_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the status table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_pad(detailed_data):
    pads = {}

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            pad = row.get('pad', {})
            if pad:
                pad_id = pad.get('id')
                if pad_id not in pads:
                    pads[pad_id] = [
                        pad_id,
                        pad.get('name', '')
                    ]

        pad_data = list(pads.values())
        pad_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.pad 
            (id, name) 
            VALUES (%s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in pad_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the pad table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_mission(detailed_data):
    missions = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            mission = row.get('mission')
            
            if mission:
                mission_id = mission.get('id')
                if mission_id and mission_id not in missions:
                    orbit = mission.get('orbit', {})
                    missions[mission_id] = [
                        mission_id,
                        mission.get('name', ''),
                        mission.get('description', ''),
                        mission.get('type', ''),
                        orbit.get('id', '') if orbit else ''
                    ]

        mission_data = list(missions.values())
        mission_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.mission 
            (id, name, description, type, orbit_id) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                type = EXCLUDED.type,
                orbit_id = EXCLUDED.orbit_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in mission_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the mission table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_orbit(detailed_data):
    orbits = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            mission = row.get('mission')
            if mission:
                orbit = mission.get('orbit')
                if orbit:
                    orbit_id = orbit.get('id')
                    if orbit_id and orbit_id not in orbits:
                        orbits[orbit_id] = [
                            orbit_id,
                            orbit.get('name', ''),
                            orbit.get('abbrev', '')
                        ]

        orbit_data = list(orbits.values())
        orbit_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.orbit 
            (id, name, abbrev) 
            VALUES (%s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                abbrev = EXCLUDED.abbrev;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in orbit_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the orbit table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_launch_service_provider(detailed_data):
    providers = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            provider = row.get('launch_service_provider', {})
            if provider:
                provider_id = provider.get('id')
                if provider_id and provider_id not in providers:
                    providers[provider_id] = [
                        provider_id,
                        provider.get('name', '')
                    ]

        provider_data = list(providers.values())
        provider_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.launch_service_provider 
            (id, name) 
            VALUES (%s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in provider_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the launch_service_provider table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_launcher_stage(detailed_data):
    launcher_stages = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                stage_id = stage.get('id')
                if stage_id and stage_id not in launcher_stages:
                    launcher_stages[stage_id] = [
                        stage_id,
                        stage.get('type', ''),
                        stage.get('reused', ''),
                        stage.get('launcher_flight_number', ''),
                        stage.get('launcher', {}).get('id', ''),
                        stage.get('landing', {}).get('id', '')
                    ]
                    
        launcher_stage_data = list(launcher_stages.values())
        launcher_stage_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.launcher_stage 
            (id, type, reused, launcher_flight_number, launcher_id, landing_id) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                type = EXCLUDED.type,
                reused = EXCLUDED.reused,
                launcher_flight_number = EXCLUDED.launcher_flight_number,
                launcher_id = EXCLUDED.launcher_id,
                landing_id = EXCLUDED.landing_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in launcher_stage_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the launcher_stage table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_launcher(detailed_data):
    launchers = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        i = 0
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                launcher = stage.get('launcher', {})
                if launcher:
                    launcher_id = launcher.get('id')
                    if launcher_id:
                        launchers[i] = [
                            launcher_id,
                            launcher.get('serial_number', ''),
                            launcher.get('status', ''),
                            launcher.get('successful_landings', ''),
                            launcher.get('attempted_landings', ''),
                            launcher.get('flights', ''),
                            launcher.get('last_launch_date', ''),
                            launcher.get('first_launch_date', '')
                        ]
                        i += 1
                    
        launcher_data = list(launchers.values())
        launcher_data.sort(key=lambda x: x[0])  # Sort by id


        df = pd.DataFrame(launcher_data, columns=['id', 'serial_number', 'status', 'successful_landings', 'attempted_landings', 'flights', 'last_launch_date', 'first_launch_date'])
        df = df.sort_values(by=["serial_number", "last_launch_date"])

        df_grouped = df.groupby("serial_number").last().reset_index()
        df_grouped = df_grouped.sort_values(by=["last_launch_date"])
        df_grouped = df_grouped[['id', 'serial_number', 'status', 'successful_landings', 'attempted_landings', 'flights', 'last_launch_date', 'first_launch_date']]

        upsert_query = """
            INSERT INTO spacex.launcher 
            (id, serial_number, status, successful_landings, attempted_landings, flights, last_launch_date, first_launch_date) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                serial_number = EXCLUDED.serial_number,
                status = EXCLUDED.status,
                successful_landings = EXCLUDED.successful_landings,
                attempted_landings = EXCLUDED.attempted_landings,
                flights = EXCLUDED.flights,
                last_launch_date = EXCLUDED.last_launch_date,
                first_launch_date = EXCLUDED.first_launch_date;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in df_grouped.itertuples(index=False, name=None):
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the launcher table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_landing(detailed_data):
    landings = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                landing = stage.get('landing', {})
                if landing:
                    landing_id = landing.get('id')
                    if landing_id and landing_id not in landings:
                        landings[landing_id] = [
                            landing_id,
                            landing.get('attempt'),
                            landing.get('success'),
                            landing.get('location', {}).get('id') if landing.get('location', {}) else '',
                            landing.get('type', {}).get('id') if landing.get('type', {}) else ''
                        ]
                    
        landing_data = list(landings.values())
        landing_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.landing 
            (id, attempt, success, location_id, type_id) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                attempt = EXCLUDED.attempt,
                success = EXCLUDED.success,
                location_id = EXCLUDED.location_id,
                type_id = EXCLUDED.type_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in landing_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the landing table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_landing_location(detailed_data):
    locations = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                landing = stage.get('landing', {})
                location = landing.get('location', {})
                if location:
                    location_id = location.get('id')
                    if location_id and location_id not in locations:
                        locations[location_id] = [
                            location_id,
                            location.get('name', ''),
                            location.get('abbrev', ''),
                            location.get('description', '')
                        ]
                    
        landing_location_data = list(locations.values())
        landing_location_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.landing_location
            (id, name, abbrev, description) 
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                name = EXCLUDED.name,
                abbrev = EXCLUDED.abbrev,
                description = EXCLUDED.description;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in landing_location_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the landing_location table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_landing_type(detailed_data):
    types = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                landing = stage.get('landing', {})
                landing_type = landing.get('type', {})
                if landing_type:
                    type_id = landing_type.get('id')
                    if type_id and type_id not in types:
                        types[type_id] = [
                            type_id,
                            landing_type.get('name', ''),
                            landing_type.get('abbrev', ''),
                            landing_type.get('description', '')
                        ]
                    
        landing_type_data = list(types.values())
        landing_type_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.landing_type
            (id, name, abbrev, description) 
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                name = EXCLUDED.name,
                abbrev = EXCLUDED.abbrev,
                description = EXCLUDED.description;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in landing_type_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the landing_type table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

def get_rocket_to_launcher_stage(detailed_data):
    rocket_to_launcher_stage_data = []

    # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            rocket_id = rocket.get('id', '')  # Get the rocket ID
            for stage in stages:
                stage_id = stage.get('id', '')  # Get the launcher stage ID
                if rocket_id and stage_id:  # Ensure both IDs are present
                    rocket_to_launcher_stage_data.append([rocket_id, stage_id])

        # Sort data by 'net' in descending order
        rocket_to_launcher_stage_data.sort(key=lambda x: x[1], reverse=True)


        upsert_query = """
            INSERT INTO spacex.rocket_to_launcher_stage 
            (rocket_id, launcher_stage_id) 
            VALUES (%s, %s)
            ON CONFLICT (rocket_id, launcher_stage_id)
            DO UPDATE SET 
                rocket_id = EXCLUDED.rocket_id,
                launcher_stage_id = EXCLUDED.launcher_stage_id;
            """

        # Use a new cursor for inserting data
        with conn.cursor() as write_cursor:
            for row in rocket_to_launcher_stage_data:
                write_cursor.execute(upsert_query, row)
            
            # Commit the transaction after all inserts are done
            conn.commit()
            print("Data updated successfully into the rocket_to_launcher_stage table.")

    except (Exception, psycopg2.Error) as error:
        print("Error:", error)
        conn.rollback()  # Rollback in case of any error
    finally:
        # Closing database connection
        if conn:
            conn.close()

### READ DATA FROM OUR DATABASE TABLEAS AND SAVE IT TO USE IN FRONTEND ###

def get_main_data_frontend():

    # List of file names
    table_names = [
        'launch',
        'status',
        'pad',
        'mission',
        'orbit',
        'rocket_configuration',
        'configuration',
        'rocket_to_launcher_stage',
        'launcher_stage',
        'launcher',
        'landing',
        'landing_location',
        'landing_type'
    ]

    # Dictionary to store the DataFrames
    dataframes = {}

    # Read each table from the database
    for table_name in table_names:
        
        query = f"SELECT * FROM spacex.{table_name};"

        # Connect to the database   
        conn = psycopg2.connect(**db_info)
        cur = conn.cursor()

        try:
            # Use a single cursor for fetching data
            with conn.cursor() as cur:
                cur.execute(query)
                # Fetch all rows from the table
                rows = cur.fetchall()
                # Get the column names from the cursor description
                columns = [desc[0] for desc in cur.description]
                df = pd.DataFrame(rows, columns=columns)
                # Add the DataFrame to the dictionary with the table name as key
                dataframes[table_name] = df

        except (Exception, psycopg2.Error) as error:
            print("Error fetching data:", error)
        
        finally:
            if conn:
                conn.close()


    # Join dataframes
    try:
        df_table_launch_1 = pd.merge(dataframes['launch'], dataframes['status'].add_prefix('status_'), on='status_id', how='left')
        df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['pad'].add_prefix('pad_'), on='pad_id', how='left')

        df_mission_orbit = pd.merge(dataframes['mission'], dataframes['orbit'].add_prefix('orbit_'), on='orbit_id', how='left')
        df_table_launch_1 = pd.merge(df_table_launch_1, df_mission_orbit.add_prefix('mission_'), on='mission_id', how='left')

        df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['rocket_configuration'], on='rocket_id', how='left')
        df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['configuration'].add_prefix('configuration_'), on='configuration_id', how='left')

        df_launcher_stage = pd.merge(dataframes['launcher_stage'], dataframes['launcher'].add_prefix('launcher_'), on='launcher_id', how='left')
        df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing'].add_prefix('landing_'), on='landing_id', how='left')
        df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing_location'].add_prefix('landing_location_'), on='landing_location_id', how='left')
        df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing_type'].add_prefix('landing_type_'), on='landing_type_id', how='left')

        df_launcher_stage = df_launcher_stage.rename(columns={'id': 'launcher_stage_id'})

        df_table_launch_2 = pd.merge(df_table_launch_1, dataframes['rocket_to_launcher_stage'], on='rocket_id', how='left')
        df_table_launch_2 = pd.merge(df_table_launch_2, df_launcher_stage, on='launcher_stage_id', how='left')

        # print("Successfully joined launch and rocket_to_configuration DataFrames.")
    except Exception as e:
        print(f"Error joining launch and rocket_to_configuration DataFrames: {e}")


    selected_columns_1 = ['id', 'net', 'status_abbrev', 'pad_name', 'mission_name', 'mission_orbit_abbrev', 'configuration_name']
    selected_columns_2 = ['id', 'reused', 'launcher_serial_number', 'landing_location_abbrev', 'landing_type_abbrev', 'landing_attempt','landing_success']
    df_table_launch_1 = df_table_launch_1[selected_columns_1]
    df_table_launch_2 = df_table_launch_2[selected_columns_2]

    df_table_launch_2_agg = df_table_launch_2.groupby('id').agg({
        'reused': list,
        'launcher_serial_number': list,
        'landing_location_abbrev': list,
        'landing_type_abbrev': list,
        'landing_attempt': list,
        'landing_success': list
    }).reset_index()

    df_table_launch = pd.merge(df_table_launch_1, df_table_launch_2_agg, on='id', how='left')

    df_table_launch = df_table_launch.dropna(how='all') # drop empty rows

    # Filter data
    df_table_launch = df_table_launch[df_table_launch['configuration_name'].isin(['Falcon 9', 'Falcon Heavy', 'Starship', 'Falcon 1'])]

    # Change columns that need it
    # datetime clean and delete seconds
    df_table_launch['net'] = pd.to_datetime(df_table_launch['net'], utc=True)
    df_table_launch['net'] = df_table_launch['net'].dt.tz_localize(None).dt.strftime('%Y-%m-%d %H:%M:%S')

    # Add columns 
    df_table_launch['net'] = pd.to_datetime(df_table_launch['net'])
    df_table_launch['year'] = df_table_launch['net'].dt.year
    df_table_launch['year_month'] = df_table_launch['net'].dt.to_period('M').astype(str)

    df_table_launch.insert(2, 'date_time', df_table_launch['net'].dt.tz_localize(None).dt.strftime('%Y-%m-%d %H:%M'))

    # starlink comercial
    df_table_launch['mission_name'] = df_table_launch['mission_name'].fillna('')
    df_table_launch['starlink_commercial'] = df_table_launch['mission_name'].apply(lambda x: 'Starlink' if 'starlink'.lower() in x.lower() else 'Commercial')


    # group orbit into LEO - GEO - SSO - Other
    # Define the mapping
    orbit_mapping = {
        'LEO': 'LEO',
        'GTO': 'GEO',
        'Direct-GEO': 'GEO',
        'SSO': 'SSO'
    }
    # Create a new column or replace the existing one
    df_table_launch['mission_orbit_abbrev'] = df_table_launch['mission_orbit_abbrev'].map(lambda x: orbit_mapping.get(x, 'OTHER'))

    # PAD NAME change
    orbit_mapping = {
        'Space Launch Complex 4E': 'SLC 4E',
        'Space Launch Complex 40': 'SLC 40',
        'Launch Complex 39A': 'LC 39A',
        'Omelek Island': 'Omelek',
        'Orbital Launch Mount A': 'OLM A'
    }
    df_table_launch['pad_name'] = df_table_launch['pad_name'].map(lambda x: orbit_mapping.get(x, 'OTHER'))


    # Assuming 'db_info' contains your database connection details
    engine = create_engine(f"postgresql+psycopg2://{db_info['user']}:{db_info['password']}@{db_info['host']}:{db_info['port']}/{db_info['dbname']}")

    # Save DataFrame to SQL table
    df_table_launch.to_sql(
        name='launch',
        schema='spacexnumbers_frontend',  # Specify the schema here
        con=engine, 
        if_exists='replace',  # 'replace' will drop the table if it exists and create a new one. Use 'append' to add to an existing table.
        index=False  # If your DataFrame index is not needed in the SQL table
    )

    ### HOME PAGE TOTALS ###

    # Get data for the HomePage
    selected_columns_summary = ['id', 'status_abbrev', 'configuration_name', 'landing_attempt', 'landing_success']
    df_table_launch_summary = df_table_launch[selected_columns_summary]

    df_totals = df_table_launch_summary.groupby('configuration_name').agg({'id': 'count'}).reset_index()
    df_totals = df_totals.rename(columns={'id': 'launch_count'})
    df_totals[['launch_success', 'landing_count', 'landing_attempt']] = 0

    # Iterate over each row in the DataFrame
    for index, row in df_table_launch_summary.iterrows():

        if row.status_abbrev != 'Failure':
            mask = df_totals['configuration_name'] == row.configuration_name
            df_totals.loc[mask, 'launch_success'] += 1

        for landing_attempt in row.landing_attempt:
            if landing_attempt == True:
                mask = df_totals['configuration_name'] == row.configuration_name
                df_totals.loc[mask, 'landing_attempt'] += 1

        for landing_success in row.landing_success:
            if landing_success == True:
                mask = df_totals['configuration_name'] == row.configuration_name
                df_totals.loc[mask, 'landing_count'] += 1


    # Save DataFrame to SQL table
    df_totals.to_sql(
        name='totals', 
        schema='spacexnumbers_frontend',  # Specify the schema here
        con=engine, 
        if_exists='replace',  # 'replace' will drop the table if it exists and create a new one. Use 'append' to add to an existing table.
        index=False  # If your DataFrame index is not needed in the SQL table
    )

    # Calculate current year, py comparable (same date as current year)
    # ho fem manualment ara per teni full 2024 i 2023 data, despres ja afegim algo per el current year que sigui fiull automatitzat

    current_year = 2024 #datetime.now().year 
    df_cy = df_table_launch[df_table_launch['year'] == current_year] # current year

    # last_date = datetime.now() - relativedelta(years=1)
    df_cy_yoy = df_table_launch[df_table_launch['year'] == current_year - 1]
    # df_cy_yoy = df_cy_yoy[df_table_launch['net'] <= last_date] 

    df_py = df_table_launch[df_table_launch['year'] == current_year - 1]
    df_py_yoy = df_table_launch[df_table_launch['year'] == current_year - 2]

    # Transfor df
    df_cy_summary = df_cy[selected_columns_summary]
    df_cy_yoy_summary = df_cy_yoy[selected_columns_summary]
    df_py_summary = df_py[selected_columns_summary]
    df_py_yoy_summary = df_py_yoy[selected_columns_summary]

    df_cy_totals = df_cy_summary.groupby('configuration_name').agg({'id': 'count'}).reset_index()
    df_cy_totals = df_cy_totals.rename(columns={'id': 'launch_count_cy'})

    df_cy_yoy_totals = df_cy_yoy_summary.groupby('configuration_name').agg({'id': 'count'}).reset_index()
    df_cy_yoy_totals = df_cy_yoy_totals.rename(columns={'id': 'launch_count_cy_yoy'})

    df_py_totals = df_py_summary.groupby('configuration_name').agg({'id': 'count'}).reset_index()
    df_py_totals = df_py_totals.rename(columns={'id': 'launch_count_py'})

    df_py_yoy_totals = df_py_yoy_summary.groupby('configuration_name').agg({'id': 'count'}).reset_index()
    df_py_yoy_totals = df_py_yoy_totals.rename(columns={'id': 'launch_count_py_yoy'})

    df_all_years_totals = pd.merge(df_cy_totals, df_cy_yoy_totals, on='configuration_name', how='left')
    df_all_years_totals = pd.merge(df_all_years_totals, df_py_totals, on='configuration_name', how='left')
    df_all_years_totals = pd.merge(df_all_years_totals, df_py_yoy_totals, on='configuration_name', how='left').fillna(0)

    # Clean the data
    float_columns = df_all_years_totals.select_dtypes(include=[float])
    df_all_years_totals[float_columns.columns] = float_columns.astype(int)

    # Save DataFrame to SQL table
    df_all_years_totals.to_sql(
        name='year_totals', 
        schema='spacexnumbers_frontend',  # Specify the schema here
        con=engine, 
        if_exists='replace',  # 'replace' will drop the table if it exists and create a new one. Use 'append' to add to an existing table.
        index=False  # If your DataFrame index is not needed in the SQL table
    )

    print("Frontend data updated successfully.")

def get_last_refresh_frontend():

    # Assuming 'db_info' contains your database connection details
    engine = create_engine(f"postgresql+psycopg2://{db_info['user']}:{db_info['password']}@{db_info['host']}:{db_info['port']}/{db_info['dbname']}")

    df_last_refresh = pd.DataFrame({
        'last_refresh': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
    })

    # Save last refresh
    df_last_refresh.to_sql(
        name='last_refresh', 
        schema='spacexnumbers_frontend',  # Specify the schema here
        con=engine, 
        if_exists='replace',  # 'replace' will drop the table if it exists and create a new one. Use 'append' to add to an existing table.
        index=False  # If your DataFrame index is not needed in the SQL table
    )

    print("Last refresh updated successfully:", df_last_refresh['last_refresh'].values[0])

if __name__ == "__main__":

    # Check if there is any launch that hasn't been completed
    # and update both previous and detailed if needed
    updated_launches = spacex_not_completed_launches()

    # UPDATE PREVIOUS LAUNCHES
    new_launches, new_spacex_launches = update_previous_launches()
    
    # Only update the detailed data if there are new SpaceX launches
    # or any launch that has been updated
    if new_spacex_launches > 0 or updated_launches > 0:
        # GET DETAILED INFORMATION FOR THE SPACEX LAUNCHES
        update_spacex_detailed_launches()

        detailed_data = fetch_detailed_data()
        get_launches(detailed_data)
        get_configuration(detailed_data)
        get_rocket_configuration(detailed_data)
        get_status(detailed_data) 
        get_pad(detailed_data)
        get_mission(detailed_data) 
        get_orbit(detailed_data)
        get_launch_service_provider(detailed_data)
        get_launcher_stage(detailed_data)
        get_launcher(detailed_data)
        get_landing(detailed_data)
        get_landing_location(detailed_data)
        get_landing_type(detailed_data)
        get_rocket_to_launcher_stage(detailed_data)


        # Frontend data is only refreshed if new launches are found.
        get_main_data_frontend()

    # Last refresh is always updated
    get_last_refresh_frontend()