@echo off
setlocal enabledelayedexpansion

:: Change to the parent directory of the current script's location
cd /d "%~dp0\.."

:: Run Python scripts from the backend directory
cd backend
echo Running Python scripts...
python get_json_data.py
python get_rel_db.py
python get_data_frontend.py

:: Check if any Python script failed
if %errorlevel% neq 0 (
    echo One or more Python scripts failed.
    pause
    exit /b %errorlevel%
)
