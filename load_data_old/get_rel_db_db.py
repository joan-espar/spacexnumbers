import os
import psycopg2
from dotenv import load_dotenv
import pandas as pd

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

    except (Exception, psycopg2.Error) as error:
        print("Error fetching data:", error)
    
    finally:
        if conn:
            conn.close()
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

def get_launcher_old(detailed_data):
    launchers = {}

   # Connect to the database   
    conn = psycopg2.connect(**db_info)

    try:
        for row in detailed_data:
            rocket = row.get('rocket', {})
            stages = rocket.get('launcher_stage', [])
            for stage in stages:
                launcher = stage.get('launcher', {})
                if launcher:
                    launcher_id = launcher.get('id')
                    if launcher_id and launcher_id not in launchers:
                        launchers[launcher_id] = [
                            launcher_id,
                            launcher.get('flight_proven', ''),
                            launcher.get('serial_number', ''),
                            launcher.get('status', ''),
                            launcher.get('successful_landings', ''),
                            launcher.get('attempted_landings', ''),
                            launcher.get('flights', ''),
                            launcher.get('last_launch_date', ''),
                            launcher.get('first_launch_date', '')
                        ]
                    
        launcher_data = list(launchers.values())
        launcher_data.sort(key=lambda x: x[0])  # Sort by id

        upsert_query = """
            INSERT INTO spacex.launcher 
            (id, flight_proven, serial_number, status, successful_landings, attempted_landings, flights, last_launch_date, first_launch_date) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) 
            DO UPDATE SET
                flight_proven = EXCLUDED.flight_proven,
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
            for row in launcher_data:
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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

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
            print("PostgreSQL connection is closed")

# Example usage
if __name__ == "__main__":
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