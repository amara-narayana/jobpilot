# JobPilot Entity Relationship Documentation

This document describes the schema architecture and relationships of the JobPilot database.

```mermaid
erDiagram
    users ||--o{ user_sessions : "has many"
    users ||--o{ otp_verifications : "has many"
    users ||--o{ password_reset_tokens : "has many"
    users ||--|| user_preferences : "has one"
    users ||--|| notification_preferences : "has one"
    users ||--o{ companies : "tracks"
    users ||--o{ applications : "manages"
    users ||--o{ interviews : "schedules"
    users ||--o{ documents : "owns"
    users ||--o{ reminders : "receives"
    users ||--o{ activity_logs : "records"

    companies ||--o{ applications : "has"
    applications ||--o{ application_status_history : "tracks changes"
    applications ||--o{ interviews : "stages"
    applications ||--o{ documents : "associates"
    applications ||--o{ reminders : "triggers"
    interviews ||--o{ reminders : "schedules"

    users {
        BIGINT id PK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR password_hash
        BOOLEAN is_verified
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    user_sessions {
        BIGINT id PK
        BIGINT user_id FK
        CHAR session_token_hash UK
        VARCHAR ip_address
        TEXT user_agent
        TIMESTAMP expires_at
        TIMESTAMP last_active_at
    }

    applications {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT company_id FK
        VARCHAR company_name
        VARCHAR job_title
        ENUM status
        DECIMAL salary_min
        DECIMAL salary_max
        VARCHAR currency
        DATE deadline
        DATE date_applied
    }

    interviews {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT application_id FK
        DATETIME interview_date
        VARCHAR timezone
        VARCHAR interview_type
        SMALLINT interview_round
        VARCHAR result
    }

    reminders {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT application_id FK
        BIGINT interview_id FK
        VARCHAR title
        VARCHAR reminder_type
        DATETIME due_date
        BOOLEAN is_completed
        BOOLEAN is_sent
    }
```

### Key Relational Safeguards
1. **Multi-User Isolation**: Every top-level entity (`applications`, `companies`, `interviews`, `documents`, `reminders`) has a direct `user_id` foreign key referencing `users(id)` with `ON DELETE CASCADE`. Queries MUST filter by `user_id` to guarantee tenant isolation.
2. **Orphan Prevention**: When an application is deleted, associated `interviews`, `reminders`, and `application_status_history` are automatically cascade-deleted.
3. **Graceful Company Decoupling**: If a `company` record is deleted, its associated `applications` have `company_id` set to `NULL` (`ON DELETE SET NULL`) while preserving the denormalized `company_name` in the application record.
