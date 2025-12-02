@echo off
setlocal enabledelayedexpansion
title Run OwO (Safe Mode)

echo ===============================
echo         Starting OwO
echo ===============================
echo.

REM --- CEK GIT ---
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git tidak ditemukan di PATH.
    goto END
)

REM --- CEK NPM ---
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm tidak ditemukan di PATH.
    goto END
)

echo.
echo [INFO] Pulling update dari repo secara aman...
git stash --include-untracked
if %errorlevel% neq 0 (
    echo [ERROR] Gagal melakukan stash.
    goto END
)

git pull
if %errorlevel% neq 0 (
    echo [ERROR] Gagal melakukan git pull.
    goto END
)

REM Buang stash (opsional)
git stash drop >nul 2>nul

echo.
echo [INFO] Menjalankan npm install...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install error.
    goto END
)

echo.
echo [INFO] Menjalankan npm run dev...
npm run dev
if %errorlevel% neq 0 (
    echo [ERROR] npm run dev error.
    goto END
)

goto END

:END
echo.
echo ===============================
echo   Script selesai / error terjadi
echo   Tekan tombol apapun untuk exit
echo ===============================
pause >nul
exit /b
