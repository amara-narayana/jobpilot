#!/usr/bin/env bash
# ==============================================================================
# JobPilot Linux Native Startup Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "==================================================="
echo "          JobPilot Server Launcher (Linux)         "
echo "==================================================="

cd "${ROOT_DIR}"

# Ensure uploads directory exists
if [ ! -d "uploads" ]; then
    echo "[+] Creating uploads directory..."
    mkdir -p uploads
fi

# Check MySQL connectivity
if command -v mysqladmin &> /dev/null; then
    if mysqladmin ping --silent &> /dev/null; then
        echo "[+] Local MySQL server is responsive."
    else
        echo "[!] Warning: MySQL server did not respond to ping. Ensure systemctl start mysql is run."
    fi
fi

# Verify backend binary
if [ ! -f "backend/build/jobpilot_server" ]; then
    echo "[ERROR] Backend binary not found at backend/build/jobpilot_server"
    echo "[!] Run: cd backend && cmake -B build -G Ninja && cmake --build build"
    exit 1
fi

# Export environment if .env exists
if [ -f ".env" ]; then
    echo "[+] Sourcing environment variables from .env"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

echo ""
echo "==================================================="
echo "[+] Starting JobPilot C++ Drogon Backend on port 8080..."
echo "[+] Healthcheck: http://localhost:8080/api/v1/health"
echo "==================================================="
echo ""

exec backend/build/jobpilot_server
