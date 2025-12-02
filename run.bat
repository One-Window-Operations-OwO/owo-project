@echo off
title Run OwO
echo ===============================
echo         Starting OwO
echo ===============================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git tidak ditemukan di PATH.
    pause
    exit /b
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js / npm tidak ditemukan di PATH.
    pause
    exit /b
)

echo Menarik update terbaru dari repository...
git fetch --all
git reset --hard HEAD
git pull --force
echo.

echo Menjalankan npm install dan npm run dev...
npm install
npm run dev

echo.
pause