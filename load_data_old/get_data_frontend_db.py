import pandas as pd
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pytz
import numpy as np
import psycopg2
from dotenv import load_dotenv
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

def get_data_frontend():

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
