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

:: Git operations
echo Adding changes to Git...
git add .

:: Get current date and time for commit message
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "formattedDate=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%"

:: Commit changes
git commit -m "Data update: %formattedDate%"

:: Push to develop branch
git push origin develop

:: Switch to main branch
git checkout main

:: Merge develop into main
git merge develop

:: Push main branch
git push origin main

:: Switch back to develop branch
git checkout develop

echo Update and merge completed successfully!
pause