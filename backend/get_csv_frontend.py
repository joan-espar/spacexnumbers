import pandas as pd
import os
import datetime

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

    # print(df_table_launch_2.tail(5))
    # print(df_launcher_stage.columns)
    # print(df_table_launch_2.columns)
    print("Successfully joined launch and rocket_to_configuration DataFrames.")
except Exception as e:
    print(f"Error joining launch and rocket_to_configuration DataFrames: {e}")


selected_columns_1 = ['id', 'net', 'status_abbrev', 'pad_name', 'mission_name', 'mission_orbit_abbrev', 'configuration_name']
selected_columns_2 = ['id', 'launcher_serial_number', 'landing_location_abbrev', 'landing_type_abbrev', 'landing_attempt','landing_success']
df_table_launch_1 = df_table_launch_1[selected_columns_1]
df_table_launch_2 = df_table_launch_2[selected_columns_2]

df_table_launch_2_agg = df_table_launch_2.groupby('id').agg({
    'launcher_serial_number': list,
    'landing_location_abbrev': list,
    'landing_type_abbrev': list,
    'landing_attempt': list,
    'landing_success': list
}).reset_index()

df_table_launch = pd.merge(df_table_launch_1, df_table_launch_2_agg, on='id', how='left')

df_table_launch = df_table_launch.dropna(how='all') # drop empty rows

# Filter data
df_table_launch = df_table_launch[df_table_launch['configuration_name'].isin(['Falcon 9', 'Falcon Heavy', 'Starship'])]

# Add columns 
df_table_launch['net'] = pd.to_datetime(df_table_launch['net'])
df_table_launch['year'] = df_table_launch['net'].dt.year
df_table_launch['year_month'] = df_table_launch['net'].dt.to_period('M').astype(str)

df_table_launch['starlink_commercial'] = df_table_launch['mission_name'].apply(lambda x: 'Starlink' if 'starlink'.lower() in x.lower() else 'Commercial')

# Save the joined DataFrame to a new CSV file
output_file_path = "./../frontend/public/data/table_launch_1.csv"
df_table_launch.to_csv(output_file_path, index=False)
print(f"Joined DataFrame saved to {output_file_path}")

# Save last refresh datetime
output_file_path_last_refresh = "./../frontend/public/data/last_refresh.txt"
current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open(output_file_path_last_refresh, 'w') as file:
    file.write(current_time)