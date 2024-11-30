@echo off
setlocal enabledelayedexpansion

:: Change to the directory where your script is located
:: cd /d "" :: directory is already in the same as the .bat file

:: Run Python scripts
echo Running Python scripts...
python get_json_data.py
python get_rel_db.py
python get_csv_frontend.py

:: Check if any Python script failed
if %errorlevel% neq 0 (
    echo One or more Python scripts failed.
    pause
    exit /b %errorlevel%
)
