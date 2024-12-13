import os
import json
import requests
import time
from datetime import datetime
import shutil

DELAY = 10 # 240  # 240 seconds (4 minutes) between API calls

def update_launches(base_directory):
    url = "https://ll.thespacedevs.com/2.2.0/launch/previous/?sort=-net"
    params = {'limit': 100, 'sort': '-net'}  # Maximum number of results per page


    if not os.path.exists(base_directory):
        os.makedirs(base_directory)

    # Load existing launch IDs from stored JSON files
    existing_launch_ids = set()
    for year_dir in os.listdir(base_directory):
        year_path = os.path.join(base_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                existing_launch_ids.add(launch_file.split('.')[0])

    new_launches = 0

    try:
        # Initial API call to get total number of launches
        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()

        print("Updating local data with new launches...")

        # Proceed with fetching and updating new launches
        while url:
            response = requests.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            launches = data.get('results', [])

            for launch in launches:
                launch_id = launch.get('id')
                if launch_id in existing_launch_ids:
                    print("\nFound an existing launch ID. Stopping the update process.")
                    return new_launches

                launch_date = datetime.fromisoformat(launch.get('net').split('T')[0])
                year = str(launch_date.year)
                year_directory = os.path.join(base_directory, year)

                if not os.path.exists(year_directory):
                    os.makedirs(year_directory)

                file_path = os.path.join(year_directory, f"{launch_id}.json")

                with open(file_path, 'w') as json_file:
                    json.dump(launch, json_file, indent=4)
                new_launches += 1
                existing_launch_ids.add(launch_id)
                print(f"Added new launch {launch_id} for year {year}")

            if data['next']:
                url = data['next']
                print(f"Waiting for {DELAY} seconds before next request...")
                time.sleep(DELAY)
            else:
                url = None

        print("\nFinished updating launches.")

    except requests.exceptions.RequestException as e:
        print(f"\nAn error occurred: {e}")

    return new_launches

def summarize_launches(base_directory):
    """Summarize the number of launches per year from stored JSON files."""
    summary = {}

    # Traverse the directory structure
    for year_dir in os.listdir(base_directory):
        year_path = os.path.join(base_directory, year_dir)
        if os.path.isdir(year_path):
            # Count the number of JSON files in each year's directory
            num_launches = len([file for file in os.listdir(year_path) if file.endswith('.json')])
            summary[year_dir] = num_launches

    return summary

def filter_and_save_spacex_launches(base_directory, spacex_directory):
    """Filter SpaceX launches and save them to a separate directory if they don't already exist."""
    if not os.path.exists(spacex_directory):
        os.makedirs(spacex_directory)

    # Traverse the directory structure
    for year_dir in os.listdir(base_directory):
        year_path = os.path.join(base_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch_data = json.load(json_file)
                        # Check if the launch service provider is SpaceX
                        if launch_data.get('launch_service_provider', {}).get('name') == "SpaceX":
                            # Create year subdirectory in SpaceX directory if it doesn't exist
                            spacex_year_dir = os.path.join(spacex_directory, year_dir)
                            if not os.path.exists(spacex_year_dir):
                                os.makedirs(spacex_year_dir)
                            
                            # Check if the file already exists in the SpaceX directory
                            spacex_file_path = os.path.join(spacex_year_dir, launch_file)
                            if not os.path.exists(spacex_file_path):
                                # Copy the JSON file to the SpaceX directory
                                shutil.copy(file_path, spacex_year_dir)
                                print(f"Copied {launch_file} to {spacex_year_dir}")
                            else:
                                print(f"Skipped {launch_file} (already exists in {spacex_year_dir})")

    print("Finished filtering and saving SpaceX launches")



def get_detailed_launches(spacex_directory, spacex_detailed_directory):
    if not os.path.exists(spacex_detailed_directory):
        os.makedirs(spacex_detailed_directory)

    api_base_url = "https://ll.thespacedevs.com/2.2.0/launch/"

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            detailed_year_dir = os.path.join(spacex_detailed_directory, year_dir)
            if not os.path.exists(detailed_year_dir):
                os.makedirs(detailed_year_dir)

            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    detailed_file_path = os.path.join(detailed_year_dir, launch_file)

                    # Check if detailed file already exists
                    if os.path.exists(detailed_file_path):
                        print(f"Detailed data for {launch_file} already exists. Skipping.")
                        continue

                    with open(file_path, 'r') as json_file:
                        launch_data = json.load(json_file)
                        launch_id = launch_data.get('id')

                    if launch_id:
                        detailed_url = f"{api_base_url}{launch_id}/"
                        try:
                            response = requests.get(detailed_url)
                            response.raise_for_status()
                            detailed_data = response.json()

                            # Save detailed data to new JSON file
                            with open(detailed_file_path, 'w') as detailed_file:
                                json.dump(detailed_data, detailed_file, indent=4)

                            print(f"Saved detailed data for launch {launch_id}")

                            # Delay to respect API rate limits
                            time.sleep(DELAY)

                        except requests.exceptions.RequestException as e:
                            print(f"Error fetching detailed data for launch {launch_id}: {e}")

    print("Finished fetching detailed launch data")


# Example usage
if __name__ == "__main__":
    base_directory = "./../previous_launches_json"
    spacex_directory = "./../spacex_launches_json"
    spacex_detailed_directory = "./../spacex_detailed_launches_json"

    # SUMMARY FO PREVIOUS LAUNCHES
    # launch_summary = summarize_launches(base_directory)
    # print("Launch Summary:")
    # for year, count in sorted(launch_summary.items()):
    #     print(f"{year}: {count} launches")

    # UPDATE PREVIOUS LAUNCHES
    new = update_launches(base_directory)
    print(f"\nTotal new launches added: {new}")

    # FILTER SPACEX AND NEW JSON DIRECTORY
    filter_and_save_spacex_launches(base_directory, spacex_directory)

    # GET DETAILED INFORMATION FOR THE SPACEX LAUNCHES
    get_detailed_launches(spacex_directory, spacex_detailed_directory)

