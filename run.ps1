Write-Host "==============================="
Write-Host "        Starting OwO"
Write-Host "==============================="
Write-Host ""

# --- CEK GIT ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git tidak ditemukan di PATH."
    Read-Host "Press Enter to exit"
    exit
}

# --- CEK NPM ---
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js / npm tidak ditemukan di PATH."
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "[INFO] Pulling update dari repository..."
git stash --include-untracked
git pull
git stash drop | Out-Null
Write-Host ""

Write-Host "[INFO] Menjalankan npm install..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install gagal."
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "[INFO] Menjalankan npm run dev..."
Write-Host "===================================="
Write-Host "   Tekan CTRL + C untuk menghentikan"
Write-Host "===================================="
Write-Host ""

# --- MENJALANKAN NPM RUN DEV TANPA MENUTUP WINDOW ---
npm run dev

# --- TETAPKAN WINDOW TERBUKA ---
Write-Host ""
Write-Host "==============================="
Write-Host "   Script selesai / dihentikan"
Write-Host "==============================="
Read-Host "Press Enter to exit"
