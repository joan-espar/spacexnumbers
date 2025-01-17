import requests
from bs4 import BeautifulSoup
import pandas as pd
from dotenv import load_dotenv
import os
import psycopg2
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

# URL to scrape
url = 'https://planet4589.org/space/con/star/stats.html'

# Fetch the webpage
response = requests.get(url)
response.raise_for_status()  # Will raise an exception for bad status codes

# Parse the HTML
soup = BeautifulSoup(response.text, 'html.parser')

# Find all tables in the document
tables = soup.find_all('table')

if tables:
    table = tables[1]  # The data we need is in the second table (index = 1)
    rows = table.find_all('tr')

    # Prepare data for DataFrame
    data = []
    
    # Write headers if they exist
    headers = [header.text.strip() for header in rows[0].find_all('th')]
    if headers:
        rows = rows[1:]  # Skip the header row for data rows
        
    for row in rows:
        # Extract text from each cell, assuming cells are either <th> or <td>
        cells = row.find_all(['th', 'td'])
        row_data = [cell.text.strip() for cell in cells]
        data.append(row_data)

    # Create DataFrame
    df = pd.DataFrame(data, columns=headers)

    # Manually select the rows we don't need, and remove them
    rows_to_delete = [0, 1, 12, 14, 21, 23]  # first is 0 and headers are not a row

    # Delete rows by index
    df = df.drop(rows_to_delete).reset_index(drop=True)

    # Merge columns:
    df.insert(loc=8, column='Failed in orbit', value = df['Screened'].fillna(0).astype(int) + df['Failed, decaying'].fillna(0).astype(int) + df['Graveyard'].fillna(0).astype(int))
    df['Out of constellation'] = df['Out of constellation'].fillna(0).astype(int) + df['Anom.'].fillna(0).astype(int)

    columns_to_remove = ['Failed to orbit', 'Screened', 'Failed, decaying', 'Graveyard', 'Anom.', 'Special', 'Orbit Heights', 'Phase vs Plane', 'Plane vs Time']
    df = df.drop(columns=columns_to_remove)

    # Define rows order
    new_index_order = {18:0, 17:1, 11:2, 12:3, 13:4, 14:5, 15:6, 16:7, 10:8, 0:9, 1:10, 2:11, 3:12, 4:13, 5:14, 6:15, 7:16, 8:17, 9:18}
    df = df.reindex(new_index_order.keys())
    df = df.reset_index(drop=True)
    
    if df.shape[0] > 0:
        conn = psycopg2.connect(**db_info)

        # Assuming 'db_info' contains your database connection details
        engine = create_engine(f"postgresql+psycopg2://{db_info['user']}:{db_info['password']}@{db_info['host']}:{db_info['port']}/{db_info['dbname']}")

        # Save DataFrame to SQL table
        df.to_sql(
            name='starlink_totals',
            schema='spacexnumbers_frontend',  # Specify the schema here
            con=engine, 
            if_exists='replace',  # 'replace' will drop the table if it exists and create a new one. Use 'append' to add to an existing table.
            index=False  # If your DataFrame index is not needed in the SQL table
        )

        print("Data has been written to starlink_totals")

else:
    print("No tables found on the page.")

