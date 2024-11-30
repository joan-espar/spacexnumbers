import os
import json
import csv

def get_launches(spacex_directory, rel_db_directory):
    launch_data = []
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        launch_data.append([
                            launch.get('id', ''),
                            launch.get('net', ''),
                            launch.get('name', ''),
                            launch.get('status', {}).get('id', ''),
                            launch.get('launch_service_provider', {}).get('id', ''),
                            launch.get('rocket', {}).get('id', ''),
                            launch.get('mission', {}).get('id', '') if launch.get('mission') else '',
                            launch.get('pad', {}).get('id', '')
                        ])

    if not os.path.exists(rel_db_directory):
        os.makedirs(rel_db_directory)

    launch_data.sort(key=lambda x: x[1], reverse=True)  # Sort by net in 

    config_file = os.path.join(rel_db_directory, 'launch.csv')
    with open(config_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'net', 'name', 'status_id', 'launch_service_provider_id', 'rocket_id', 'mission_id', 'pad_id'])
        writer.writerows(launch_data)

    print(f"Stored {len(launch_data)} SpaceX launches in {config_file}")

def get_configuration(spacex_directory, rel_db_directory):
    configurations = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        config = launch.get('rocket', {}).get('configuration', {})
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


    configurations = list(configurations.values())
    configurations.sort(key=lambda x: x[0])  # Sort by id

    config_file = os.path.join(rel_db_directory, 'configuration.csv')
    with open(config_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'active', 'reusable', 'family', 'full_name', 'variant'])
        writer.writerows(configurations)

    print(f"Stored {len(configurations)} configurations in {config_file}")

def get_rocket_to_configuration(spacex_directory, rel_db_directory):
    rocket_to_config = []

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
                        config = rocket.get('configuration', {})
                        
                        if rocket and config:
                            rocket_to_config.append([rocket.get('id', ''), config.get('id', '')])

    rocket_to_config.sort(key=lambda x: x[0])  # Sort by rocket_id

    rocket_config_file = os.path.join(rel_db_directory, 'rocket_to_configuration.csv')
    with open(rocket_config_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['rocket_id', 'configuration_id'])
        writer.writerows(rocket_to_config)

    print(f"Stored {len(rocket_to_config)} rocket-to-configuration relationships in {rocket_config_file}")

def get_status(spacex_directory, rel_db_directory):
    statuses = {}

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        status = launch.get('status', {})
                        
                        if status:
                            status_id = status.get('id')
                            if status_id not in statuses:
                                statuses[status_id] = [
                                    status_id,
                                    status.get('name', ''),
                                    status.get('abbrev', ''),
                                    status.get('description', '')
                                ]

    statuses = list(statuses.values())
    statuses.sort(key=lambda x: x[0])  # Sort by id

    status_file = os.path.join(rel_db_directory, 'status.csv')
    with open(status_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'abbrev', 'description'])
        writer.writerows(statuses)

    print(f"Stored {len(statuses)} statuses in {status_file}")

def get_pad(spacex_directory, rel_db_directory):
    pads = {}

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        pad = launch.get('pad', {})
                        
                        if pad:
                            pad_id = pad.get('id')
                            if pad_id not in pads:
                                pads[pad_id] = [
                                    pad_id,
                                    pad.get('name', '')
                                ]

    pads = list(pads.values())
    pads.sort(key=lambda x: x[0])  # Sort by id

    pad_file = os.path.join(rel_db_directory, 'pad.csv')
    with open(pad_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name'])
        writer.writerows(pads)

    print(f"Stored {len(pads)} pads in {pad_file}")

def get_mission(spacex_directory, rel_db_directory):
    missions = {}

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        mission = launch.get('mission')
                        
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

    missions = list(missions.values())
    missions.sort(key=lambda x: x[0])  # Sort by mission_id

    mission_file = os.path.join(rel_db_directory, 'mission.csv')
    with open(mission_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'description', 'type', 'orbit_id'])
        writer.writerows(missions)

    print(f"Stored {len(missions)} missions in {mission_file}")

def get_orbit(spacex_directory, rel_db_directory):
    orbits = {}

    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        mission = launch.get('mission')
                        
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

    orbits = list(orbits.values())
    orbits.sort(key=lambda x: x[0])  # Sort by orbit_id

    orbit_file = os.path.join(rel_db_directory, 'orbit.csv')
    with open(orbit_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'abbrev'])
        writer.writerows(orbits)

    print(f"Stored {len(orbits)} orbits in {orbit_file}")

def get_launch_service_provider(spacex_directory, rel_db_directory):
    providers = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        provider = launch.get('launch_service_provider', {})
                        if provider:
                            provider_id = provider.get('id')
                            if provider_id and provider_id not in providers:
                                providers[provider_id] = [
                                    provider_id,
                                    provider.get('name', '')
                                ]
    
    providers = list(providers.values())
    providers.sort(key=lambda x: x[0])  # Sort by provider_id

    provider_file = os.path.join(rel_db_directory, 'launch_service_provider.csv')
    with open(provider_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name'])
        writer.writerows(providers)

    print(f"Stored {len(providers)} launch service providers in {provider_file}")

def get_launcher_stage(spacex_directory, rel_db_directory):
    launcher_stages = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
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

    launcher_stages = list(launcher_stages.values())
    launcher_stages.sort(key=lambda x: x[0])  # Sort by stage_id

    launcher_stage_file = os.path.join(rel_db_directory, 'launcher_stage.csv')
    with open(launcher_stage_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'type', 'reused', 'launcher_flight_number', 'launcher_id', 'landing_id'])
        writer.writerows(launcher_stages)

    print(f"Stored {len(launcher_stages)} unique launcher stages in {launcher_stage_file}")

def get_launcher(spacex_directory, rel_db_directory):
    launchers = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
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

    launchers = list(launchers.values())
    launchers.sort(key=lambda x: x[0])  # Sort by id

    launcher_file = os.path.join(rel_db_directory, 'launcher.csv')
    with open(launcher_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'flight_proven', 'serial_number', 'status', 'successful_landings', 'attempted_landings', 'flights', 'last_launch_date', 'first_launch_date'])
        writer.writerows(launchers)

    print(f"Stored {len(launchers)} unique launchers in {launcher_file}")

def get_landing(spacex_directory, rel_db_directory):
    landings = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
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

    landings = list(landings.values())
    landings.sort(key=lambda x: x[0])  # Sort by id

    landing_file = os.path.join(rel_db_directory, 'landing.csv')
    with open(landing_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'attempt', 'success', 'location_id', 'type_id'])
        writer.writerows(landings)

    print(f"Stored {len(landings)} landings in {landing_file}")

def get_landing_location(spacex_directory, rel_db_directory):
    locations = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
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

    locations = list(locations.values())
    locations.sort(key=lambda x: x[0])  # Sort by id

    location_file = os.path.join(rel_db_directory, 'landing_location.csv')
    with open(location_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'abbrev', 'description'])
        writer.writerows(locations)

    print(f"Stored {len(locations)} landing locations in {location_file}")

def get_landing_type(spacex_directory, rel_db_directory):
    types = {}
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
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

    types = list(types.values())
    types.sort(key=lambda x: x[0])  # Sort by id

    type_file = os.path.join(rel_db_directory, 'landing_type.csv')
    with open(type_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['id', 'name', 'abbrev', 'description'])
        writer.writerows(types)

    print(f"Stored {len(types)} landing types in {type_file}")

def get_rocket_to_launcher_stage(spacex_directory, rel_db_directory):
    rocket_launcher_stages = []
    for year_dir in os.listdir(spacex_directory):
        year_path = os.path.join(spacex_directory, year_dir)
        if os.path.isdir(year_path):
            for launch_file in os.listdir(year_path):
                if launch_file.endswith('.json'):
                    file_path = os.path.join(year_path, launch_file)
                    with open(file_path, 'r') as json_file:
                        launch = json.load(json_file)
                        rocket = launch.get('rocket', {})
                        stages = rocket.get('launcher_stage', [])
                        rocket_id = rocket.get('id', '')  # Get the rocket ID
                        for stage in stages:
                            stage_id = stage.get('id', '')  # Get the launcher stage ID
                            if rocket_id and stage_id:  # Ensure both IDs are present
                                rocket_launcher_stages.append([rocket_id, stage_id])

    rocket_launcher_stages.sort(key=lambda x: (x[0],x[1]))  # Sort by id

    # Save to CSV file
    launcher_stage_file = os.path.join(rel_db_directory, 'rocket_to_launcher_stage.csv')
    with open(launcher_stage_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['rocket_id', 'launcher_stage_id'])
        writer.writerows(rocket_launcher_stages)

    print(f"Stored {len(rocket_launcher_stages)} rocket-launcher stage combinations in {launcher_stage_file}")

# Example usage
if __name__ == "__main__":
    spacex_directory = "./../spacex_detailed_launches_json"
    spacex_rel_db = "./../spacex_rel_db"
    # get_launches(spacex_directory, spacex_rel_db)
    get_configuration(spacex_directory, spacex_rel_db)
    # get_rocket_to_configuration(spacex_directory, spacex_rel_db)
    # get_status(spacex_directory, spacex_rel_db) 
    # get_pad(spacex_directory, spacex_rel_db)
    # get_mission(spacex_directory, spacex_rel_db) 
    # get_orbit(spacex_directory, spacex_rel_db)
    # get_launch_service_provider(spacex_directory, spacex_rel_db)
    # get_launcher_stage(spacex_directory, spacex_rel_db)
    # get_launcher(spacex_directory, spacex_rel_db)   
    # get_landing(spacex_directory, spacex_rel_db)
    # get_landing_location(spacex_directory, spacex_rel_db)
    # get_landing_type(spacex_directory, spacex_rel_db)
    # get_rocket_to_launcher_stage(spacex_directory, spacex_rel_db)