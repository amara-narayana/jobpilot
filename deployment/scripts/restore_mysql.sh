#!/usr/bin/env bash
# ==============================================================================
# JobPilot MySQL CLI Restore Script (Linux)
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql[.gz]> [database_name]"
    echo "Example: $0 database/backups/jobpilot_backup_20261102_090000.sql.gz jobpilot"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${2:-jobpilot}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-jobpilot_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "==================================================="
echo "     JobPilot Database Restore (CLI Verification)  "
echo "==================================================="
echo "[!] CAUTION: This will overwrite data in '${DB_NAME}' with contents of '${BACKUP_FILE}'."
read -p "Are you sure you wish to proceed? [y/N]: " -r CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
    echo "[ABORTED] Restore cancelled by user."
    exit 0
fi

echo "[+] Preparing restore command..."
MYSQL_CMD=("mysql" "-h" "${DB_HOST}" "-P" "${DB_PORT}" "-u" "${DB_USER}")
if [ -n "${DB_PASSWORD}" ]; then
    MYSQL_CMD+=("-p${DB_PASSWORD}")
fi
MYSQL_CMD+=("${DB_NAME}")

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo "[+] Decompressing and restoring ${BACKUP_FILE}..."
    gunzip -c "${BACKUP_FILE}" | "${MYSQL_CMD[@]}"
else
    echo "[+] Restoring ${BACKUP_FILE}..."
    "${MYSQL_CMD[@]}" < "${BACKUP_FILE}"
fi

echo "[SUCCESS] Restore finished successfully into database '${DB_NAME}'."
