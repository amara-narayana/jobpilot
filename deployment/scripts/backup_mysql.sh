#!/usr/bin/env bash
# ==============================================================================
# JobPilot MySQL CLI Backup Script (Linux)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${ROOT_DIR}"

BACKUP_DIR="${ROOT_DIR}/database/backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/jobpilot_backup_${TIMESTAMP}.sql.gz"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-jobpilot}"
DB_USER="${DB_USER:-jobpilot_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo "==================================================="
echo "     JobPilot Database Backup (mysqldump + gzip)   "
echo "==================================================="
echo "[+] Target Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "[+] Destination:     ${BACKUP_FILE}"

# Build mysqldump command
DUMP_CMD=("mysqldump" "-h" "${DB_HOST}" "-P" "${DB_PORT}" "-u" "${DB_USER}")
if [ -n "${DB_PASSWORD}" ]; then
    DUMP_CMD+=("-p${DB_PASSWORD}")
fi

DUMP_CMD+=(
    "--single-transaction"
    "--quick"
    "--routines"
    "--triggers"
    "--set-gtid-purged=OFF"
    "--default-character-set=utf8mb4"
    "${DB_NAME}"
)

# Run dump piped directly through gzip
"${DUMP_CMD[@]}" | gzip -9 > "${BACKUP_FILE}"

echo "[SUCCESS] Database backup completed: ${BACKUP_FILE}"
ls -lh "${BACKUP_FILE}"

# Retain only last 14 days of backups
echo "[+] Pruning backups older than 14 days..."
find "${BACKUP_DIR}" -name "jobpilot_backup_*.sql.gz" -mtime +14 -delete
echo "[+] Done."
