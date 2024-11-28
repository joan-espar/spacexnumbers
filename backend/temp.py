import os
import shutil
import json

def copy_detailed_launches(source_file, spacex_detailed_directory):
    if not os.path.exists(spacex_detailed_directory):
        os.makedirs(spacex_detailed_directory)

    with open(source_file,  encoding='utf-8') as file:
        json_data = json.load(file)
        launches = json_data['results']

    for launch in launches:

        launch_id = launch.get('id')
        launch_date = launch.get('net', '').split('T')[0]  # Extract date from 'net' field
        year = launch_date.split('-')[0] if launch_date else 'unknown'

        # Create year subdirectory if it doesn't exist
        year_dir = os.path.join(spacex_detailed_directory, year)
        if not os.path.exists(year_dir):
            os.makedirs(year_dir)

        # Create the destination file path
        destination_file = os.path.join(year_dir, f"{launch_id}.json")

        # Write the launch data to the destination file
        with open(destination_file, 'w') as outfile:
            json.dump(launch, outfile, indent=4)

        print(f"Copied launch {launch_id} to {destination_file}")

    print("Finished copying detailed launch data")

# Example usage
source_file = "./../detail_launch_spacex.json"
spacex_detailed_directory = "./../spacex_detailed_launches_json"
copy_detailed_launches(source_file, spacex_detailed_directory)