import pandas as pd
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pytz
import numpy as np

# Define the directory path
directory_path = './../spacex_rel_db'

# List of file names
file_names = [
    'launch',
    'status',
    'pad',
    'mission',
    'orbit',
    'rocket_to_configuration',
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

# Read each CSV file and store it in the dictionary
for file_name in file_names:
    file_path = os.path.join(directory_path, f'{file_name}.csv')
    try:
        # Read the CSV file into a DataFrame
        df = pd.read_csv(file_path)
        # Store the DataFrame in the dictionary
        dataframes[file_name] = df
        # print(f"Successfully read {file_name}.csv")
    except Exception as e:
        print(f"Error reading {file_name}.csv: {e}")

# Join dataframes
try:
    df_table_launch_1 = pd.merge(dataframes['launch'], dataframes['status'].add_prefix('status_'), on='status_id', how='left')
    df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['pad'].add_prefix('pad_'), on='pad_id', how='left')

    df_mission_orbit = pd.merge(dataframes['mission'], dataframes['orbit'].add_prefix('orbit_'), on='orbit_id', how='left')
    df_table_launch_1 = pd.merge(df_table_launch_1, df_mission_orbit.add_prefix('mission_'), on='mission_id', how='left')

    df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['rocket_to_configuration'], on='rocket_id', how='left')
    df_table_launch_1 = pd.merge(df_table_launch_1, dataframes['configuration'].add_prefix('configuration_'), on='configuration_id', how='left')

    df_launcher_stage = pd.merge(dataframes['launcher_stage'], dataframes['launcher'].add_prefix('launcher_'), on='launcher_id', how='left')
    df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing'].add_prefix('landing_'), on='landing_id', how='left')
    df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing_location'].add_prefix('landing_location_'), on='landing_location_id', how='left')
    df_launcher_stage = pd.merge(df_launcher_stage, dataframes['landing_type'].add_prefix('landing_type_'), on='landing_type_id', how='left')

    df_launcher_stage = df_launcher_stage.rename(columns={'id': 'launcher_stage_id'})

    df_table_launch_2 = pd.merge(df_table_launch_1, dataframes['rocket_to_launcher_stage'], on='rocket_id', how='left')
    df_table_launch_2 = pd.merge(df_table_launch_2, df_launcher_stage, on='launcher_stage_id', how='left')

    # print(df_launcher_stage)
    # print(df_launcher_stage.columns)
    # print(df_table_launch_2.columns)
    print("Successfully joined launch and rocket_to_configuration DataFrames.")
except Exception as e:
    print(f"Error joining launch and rocket_to_configuration DataFrames: {e}")


# print(df_table_launch_2.columns)

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


# Save the joined DataFrame to a new CSV file
output_file_path = "./../frontend/public/data/table_launch_1.csv"
df_table_launch.to_csv(output_file_path, index=False)
print(f"Joined DataFrame saved to {output_file_path}")

# Save last refresh datetime
output_file_path_last_refresh = "./../frontend/public/data/last_refresh.txt"
current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open(output_file_path_last_refresh, 'w') as file:
    file.write(current_time)


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

output_file_path_totals = "./../frontend/public/data/table_totals.csv"
df_totals.to_csv(output_file_path_totals, index=False)
print(f"Totals DataFrame saved to {output_file_path_totals}")



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

output_file_path_year_totals = "./../frontend/public/data/table_year_totals.csv"
df_all_years_totals.to_csv(output_file_path_year_totals, index=False)
print(f"Year totals DataFrame saved to {output_file_path_year_totals}")
