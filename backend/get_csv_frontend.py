import pandas as pd
import os

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
    'configuration'
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

    # print(df_table_launch_1.head(5))
    print("Successfully joined launch and rocket_to_configuration DataFrames.")
except Exception as e:
    print(f"Error joining launch and rocket_to_configuration DataFrames: {e}")

selected_columns = ['net', 'status_abbrev', 'pad_name', 'mission_name', 'mission_orbit_abbrev', 'configuration_name']
df_table_launch_1 = df_table_launch_1[selected_columns]

df_table_launch_1 = df_table_launch_1.dropna(how='all') # drop empty rows

# Filter for only falcon data
df_table_launch_1 = df_table_launch_1[df_table_launch_1['configuration_name'].isin(['Falcon 9', 'Falcon Heavy', 'Starship'])]

# Add columns 
df_table_launch_1['net'] = pd.to_datetime(df_table_launch_1['net'])
df_table_launch_1['year'] = df_table_launch_1['net'].dt.year
df_table_launch_1['year_month'] = df_table_launch_1['net'].dt.to_period('M').astype(str)

# df_table_launch_1 = df_table_launch_1.rename(columns={
#     'net': 'Date and Time',
#     'status_abbrev': 'new_column2',
#     'column3': 'new_column3'
#     })


# print(df_table_launch_1.columns)
# print(df_table_launch_1.head(5))

# # Now you can access each DataFrame using the dictionary
# for name, df in dataframes.items():
#     print(f"DataFrame: {name}")
#     print(df.head())  # Display the first few rows of each DataFrame
#     print()  # Empty line for better readability

# Save the joined DataFrame to a new CSV file
output_file_path = "./../frontend/public/data/table_launch_1.csv"
df_table_launch_1.to_csv(output_file_path, index=False)
print(f"Joined DataFrame saved to {output_file_path}")