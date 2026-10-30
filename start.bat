@echo off
title SkillShield Prototype Launcher
echo ========================================================
echo               Starting SkillShield Local Server
echo ========================================================
echo.
cd /d "%~dp0"
if not exist "server.mjs" (
  if exist "SkillShield_Prototype\server.mjs" cd /d "%~dp0SkillShield_Prototype"
)
echo Opening http://127.0.0.1:4173 in your browser...
start "" "http://127.0.0.1:4173"
echo.
echo SkillShield is active! Keep this window open while using the website.
echo To stop, press Ctrl+C or close this window.
echo.
node server.mjs
pause
