-- ============================================================================
-- JobPilot - Safe Development Seed Data
-- Database: jobpilot
-- Demo User Credentials:
--   Email:    demo@jobpilot.io
--   Password: Password123!
-- Argon2id hash generated for 'Password123!'
-- ============================================================================

USE jobpilot;

-- 1. Demo User
INSERT INTO users (id, full_name, email, password_hash, is_verified, created_at, updated_at)
VALUES (
    1,
    'Alex Rivers',
    'demo@jobpilot.io',
    '$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQxMjM0NTY3OA$9SdfmZp6bT3wB37lF24K+i5H8s4g/cQz+O9v7B6nQYk',
    TRUE,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
) ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 2. User Preferences
INSERT INTO user_preferences (user_id, theme, default_currency, timezone, email_notifications)
VALUES (
    1,
    'dark',
    'USD',
    'America/New_York',
    TRUE
) ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 3. Notification Preferences
INSERT INTO notification_preferences (user_id, email_interview_reminders, email_deadline_reminders, email_followup_reminders, email_daily_digest, lead_time_hours)
VALUES (
    1,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    24
) ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 4. Sample Companies
INSERT INTO companies (id, user_id, name, website, industry, location, recruiter_name, recruiter_email, recruiter_phone, notes)
VALUES
(1, 1, 'Stripe', 'https://stripe.com', 'Financial Technology', 'San Francisco, CA / Remote', 'Sarah Jenkins', 'sjenkins@stripe.com', '+1-415-555-0192', 'Focuses heavily on distributed systems and API design.'),
(2, 1, 'Linear', 'https://linear.app', 'Developer Tools', 'Remote', 'Marcus Vance', 'marcus@linear.app', NULL, 'Fast-paced, product-focused engineering culture.'),
(3, 1, 'Datadog', 'https://datadoghq.com', 'Cloud Monitoring', 'New York, NY', 'Elena Rostova', 'elena.r@datadoghq.com', '+1-212-555-0144', 'Observability platform, high-throughput backend systems.'),
(4, 1, 'Cloudflare', 'https://cloudflare.com', 'Cloud Infrastructure & Security', 'Austin, TX / Remote', 'David Chen', 'dchen@cloudflare.com', NULL, 'Edge compute and network routing.')
ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 5. Applications across lifecycle states
INSERT INTO applications (id, user_id, company_id, company_name, job_title, job_description, job_url, location, employment_type, salary_min, salary_max, currency, date_discovered, date_applied, deadline, resume_version, cover_letter, notes, status, created_at)
VALUES
(
    1, 1, 1, 'Stripe', 'Senior Staff Backend Engineer',
    'Design and build high-reliability ledger infrastructure handling trillions in global payments.',
    'https://stripe.com/jobs/senior-staff-backend', 'Remote', 'FULL_TIME',
    210000.00, 260000.00, 'USD',
    '2026-10-10', '2026-10-14', '2026-11-15', 'Resume_2026_Staff_v3.pdf',
    'Stripe has always inspired my standard for clean APIs...',
    'Completed screening call. Preparing for architecture deep dive.',
    'INTERVIEW', UTC_TIMESTAMP()
),
(
    2, 1, 2, 'Linear', 'Full-Stack Systems Engineer',
    'Build instantaneous, offline-capable productivity tools using modern TypeScript and reactive systems.',
    'https://linear.app/careers/systems', 'Remote', 'FULL_TIME',
    185000.00, 225000.00, 'USD',
    '2026-10-12', '2026-10-16', '2026-11-30', 'Resume_2026_FullStack.pdf',
    NULL,
    'Submitted application and code portfolio.',
    'APPLIED', UTC_TIMESTAMP()
),
(
    3, 1, 3, 'Datadog', 'Principal Systems Architect',
    'Architect scalable streaming pipelines processing tens of petabytes of telemetry daily.',
    'https://datadoghq.com/careers/arch', 'New York, NY', 'FULL_TIME',
    230000.00, 280000.00, 'USD',
    '2026-09-20', '2026-09-25', '2026-10-30', 'Resume_2026_Principal.pdf',
    NULL,
    'Offer received! Negotiating equity grant.',
    'OFFER', UTC_TIMESTAMP()
),
(
    4, 1, 4, 'Cloudflare', 'Systems Performance Engineer',
    'Optimize Rust/C++ networking proxies at global edge point of presence.',
    'https://cloudflare.com/careers/perf', 'Austin, TX', 'FULL_TIME',
    195000.00, 235000.00, 'USD',
    '2026-10-25', NULL, '2026-11-20', 'Resume_2026_Systems.pdf',
    NULL,
    'Saved role for review. Need to tailor resume towards edge networking.',
    'SAVED', UTC_TIMESTAMP()
),
(
    5, 1, NULL, 'Snowflake', 'Distributed Engine Engineer',
    'Core SQL query execution and columnar storage optimization.',
    'https://snowflake.com/careers/query-engine', 'San Mateo, CA', 'FULL_TIME',
    200000.00, 240000.00, 'USD',
    '2026-09-01', '2026-09-05', '2026-10-01', 'Resume_2026_Systems.pdf',
    NULL,
    'Position filled internally.',
    'REJECTED', UTC_TIMESTAMP()
)
ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 6. Application Status History
INSERT INTO application_status_history (application_id, from_status, to_status, notes, changed_at)
VALUES
(1, 'SAVED', 'APPLIED', 'Application submitted through referral link.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 18 DAY)),
(1, 'APPLIED', 'ASSESSMENT', 'Received online system design questionnaire.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY)),
(1, 'ASSESSMENT', 'INTERVIEW', 'Passed assessment, recruiter scheduled interview round 1.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(2, 'SAVED', 'APPLIED', 'Applied directly on careers page.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 16 DAY)),
(3, 'SAVED', 'APPLIED', 'Application submitted.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 40 DAY)),
(3, 'APPLIED', 'INTERVIEW', 'Technical screen passed.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)),
(3, 'INTERVIEW', 'OFFER', 'Executive team approved offer package.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY)),
(5, 'SAVED', 'APPLIED', 'Applied via job board.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY)),
(5, 'APPLIED', 'REJECTED', 'Automated rejection email received.', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 45 DAY));

-- 7. Interviews
INSERT INTO interviews (id, user_id, application_id, interview_date, timezone, interview_type, interview_round, meeting_link, interviewer_details, prep_notes, feedback, result)
VALUES
(
    1, 1, 1,
    DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 DAY),
    'America/New_York',
    'SYSTEM_DESIGN',
    2,
    'https://meet.google.com/xyz-jobpilot-stripe',
    'Sarah Jenkins & Principal Distributed Systems Architect',
    'Review idempotency keys, two-phase commit, and raft consensus.',
    NULL,
    'PENDING'
),
(
    2, 1, 3,
    DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY),
    'America/New_York',
    'ONSITE',
    4,
    'https://meet.google.com/datadog-onsite-round',
    'VP of Engineering & Staff Engineers',
    'Prepared telemetry throughput bottlenecks and Kafka streaming trade-offs.',
    'Strong hire recommendation across all rounds.',
    'PASSED'
)
ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 8. Reminders
INSERT INTO reminders (id, user_id, application_id, interview_id, title, description, reminder_type, due_date, is_completed, is_sent)
VALUES
(
    1, 1, 1, 1,
    'Stripe System Design Interview',
    'Prepare distributed transaction and idempotency diagrams. Review notes 30 mins before.',
    'INTERVIEW',
    DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 DAY),
    FALSE,
    FALSE
),
(
    2, 1, 4, NULL,
    'Submit Cloudflare Application',
    'Finalize custom cover letter addressing edge worker architecture before deadline.',
    'DEADLINE',
    DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 DAY),
    FALSE,
    FALSE
),
(
    3, 1, 2, NULL,
    'Linear Follow-up Check-in',
    'Send courteous follow-up email to Marcus regarding application status.',
    'FOLLOW_UP',
    DATE_ADD(UTC_TIMESTAMP(), INTERVAL 3 DAY),
    FALSE,
    FALSE
)
ON DUPLICATE KEY UPDATE updated_at = UTC_TIMESTAMP();

-- 9. Activity Logs
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
VALUES
(1, 'APPLICATION_CREATED', 'APPLICATION', 1, '{"company": "Stripe", "role": "Senior Staff Backend Engineer"}', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 18 DAY)),
(1, 'STATUS_UPDATED', 'APPLICATION', 1, '{"from": "ASSESSMENT", "to": "INTERVIEW"}', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
(1, 'INTERVIEW_SCHEDULED', 'INTERVIEW', 1, '{"round": 2, "type": "SYSTEM_DESIGN"}', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)),
(1, 'OFFER_RECEIVED', 'APPLICATION', 3, '{"company": "Datadog", "salary": "$255k base + equity"}', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 DAY));
