# JobPilot Database Administration Guide

This guide provides end-to-end instructions for database architects and system administrators managing the **JobPilot** relational database via the native **MySQL Command-Line Interface (CLI)**.

---

## 1. Connecting via MySQL CLI

Open your terminal or command prompt and connect to your MySQL 8.x instance:

```bash
# Connect as administrative user
mysql -u jobpilot_admin -p -h 127.0.0.1 -P 3306

# Or connect as root during initial setup
mysql -u root -p
```
*(Enter your password when prompted; never hardcode credentials into bash history or script files)*

---

## 2. Initial Setup: Database & Dedicated User Creation

Run the following SQL commands to provision a dedicated database user with least-privilege access restricted to `localhost` (`127.0.0.1`):

```sql
-- Create database with utf8mb4 encoding
CREATE DATABASE IF NOT EXISTS jobpilot
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create application user (replace 'StrongSecretPasswordHere!' with your actual secure secret)
CREATE USER IF NOT EXISTS 'jobpilot_user'@'localhost' IDENTIFIED BY 'StrongSecretPasswordHere!';

-- Grant required operational privileges
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES
    ON jobpilot.* TO 'jobpilot_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## 3. Selecting the Database & Inspecting Schema

```sql
-- Select the JobPilot database
USE jobpilot;

-- List all tables
SHOW TABLES;

-- Inspect table structures
DESCRIBE users;
DESCRIBE applications;
DESCRIBE interviews;
DESCRIBE documents;
DESCRIBE reminders;
```

---

## 4. Executing Schema Migrations Manually

To apply the schema migrations from your terminal:

```bash
# Apply foundational schema
mysql -u jobpilot_user -p jobpilot < database/schema/schema.sql

# Or apply specific ordered migrations
mysql -u jobpilot_user -p jobpilot < database/migrations/001_initial_schema.sql
mysql -u jobpilot_user -p jobpilot < database/migrations/002_indexes_and_constraints.sql

# Load development seed data (optional, for development environments only)
mysql -u jobpilot_user -p jobpilot < database/seeds/seeds.sql
```

---

## 5. Inspecting Indexes & Foreign Key Constraints

```sql
-- Inspect indexes on the applications table
SHOW INDEX FROM applications;

-- Check table status and storage engine (InnoDB)
SHOW TABLE STATUS LIKE 'applications'\G

-- Inspect foreign keys and constraints
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    CONSTRAINT_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'jobpilot' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 6. Running Analytical & Joined Queries

### Query 1: Active Applications with Company & Next Upcoming Interview
```sql
SELECT 
    a.id AS application_id,
    a.company_name,
    a.job_title,
    a.status,
    a.salary_min,
    a.salary_max,
    a.currency,
    i.interview_date,
    i.interview_type,
    i.interview_round
FROM applications a
LEFT JOIN interviews i ON i.application_id = a.id AND i.interview_date >= UTC_TIMESTAMP()
WHERE a.user_id = 1
ORDER BY a.updated_at DESC;
```

### Query 2: Application Pipeline Funnel Statistics
```sql
SELECT 
    status,
    COUNT(*) AS total_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM applications WHERE user_id = 1), 2) AS percentage
FROM applications
WHERE user_id = 1
GROUP BY status
ORDER BY FIELD(status, 'SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');
```

### Query 3: Upcoming Pending Reminders
```sql
SELECT 
    r.id,
    r.title,
    r.reminder_type,
    r.due_date,
    a.company_name,
    a.job_title
FROM reminders r
LEFT JOIN applications a ON r.application_id = a.id
WHERE r.user_id = 1 
  AND r.is_completed = FALSE 
  AND r.due_date >= UTC_TIMESTAMP()
ORDER BY r.due_date ASC
LIMIT 10;
```

---

## 7. Data Manipulation Examples (Safe CRUD)

### Insert New Job Application
```sql
INSERT INTO applications (
    user_id, company_name, job_title, location, 
    employment_type, salary_min, salary_max, currency, 
    date_applied, status, created_at, updated_at
) VALUES (
    1, 'Vercel', 'Senior Frontend Infrastructure Engineer', 'Remote',
    'FULL_TIME', 190000.00, 230000.00, 'USD',
    CURRENT_DATE(), 'APPLIED', UTC_TIMESTAMP(), UTC_TIMESTAMP()
);
```

### Update Application Status with Audit History in a Transaction
```sql
START TRANSACTION;

-- Record status history
INSERT INTO application_status_history (application_id, from_status, to_status, notes, changed_at)
VALUES (1, 'INTERVIEW', 'OFFER', 'Executive team approved offer package.', UTC_TIMESTAMP());

-- Update application
UPDATE applications
SET status = 'OFFER', updated_at = UTC_TIMESTAMP()
WHERE id = 1 AND user_id = 1;

COMMIT;
```

### Safe Soft/Hard Deletion with User Isolation
```sql
-- Always include user_id in the WHERE clause to preserve isolation
DELETE FROM applications 
WHERE id = 5 AND user_id = 1;
```

---

## 8. Backup and Disaster Recovery

### Creating a Full Database Backup (`mysqldump`)
```bash
# Generate single-transaction consistent backup with routines and triggers
mysqldump -u jobpilot_admin -p \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --default-character-set=utf8mb4 \
  jobpilot > database/backups/jobpilot_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring from a Backup
```bash
# Verify database exists or create it
mysql -u jobpilot_admin -p -e "CREATE DATABASE IF NOT EXISTS jobpilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Restore dump
mysql -u jobpilot_admin -p jobpilot < database/backups/jobpilot_backup_20261102_090000.sql
```

---

## 9. Diagnostic & Troubleshooting Checklist

| Symptom | Diagnostic Query / Command | Remediation |
|---|---|---|
| **Access Denied Error 1045** | `mysql -u jobpilot_user -p -h 127.0.0.1` | Check user host binding (`localhost` vs `127.0.0.1` vs `%`). Ensure password matches `.env`. |
| **Deadlock / Lock Wait Timeout** | `SHOW ENGINE INNODB STATUS\G` | Inspect transactions holding row locks. Keep Drogon async transactions short. |
| **Slow Full-text Query** | `EXPLAIN SELECT * FROM applications WHERE MATCH(company_name, job_title, notes) AGAINST('systems');` | Ensure `ft_app_search` index exists. Tune `ft_min_word_len` in `my.cnf` if searching 3-letter terms. |
| **Max Connections Exceeded** | `SHOW STATUS LIKE 'Threads_connected';` `SHOW VARIABLES LIKE 'max_connections';` | Increase `max_connections` in `my.ini` / `my.cnf` or tune Drogon pool size (`number_of_connections`). |
| **Charset Mismatch / Emoji Corruption** | `SHOW VARIABLES LIKE 'character_set%';` | Ensure `character_set_client`, `character_set_connection`, and `character_set_database` are all `utf8mb4`. |
