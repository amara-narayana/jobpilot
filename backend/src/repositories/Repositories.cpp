#include "repositories/Repositories.h"
#include <sstream>
#include <iostream>

namespace jobpilot::repositories {

// ----------------------------------------------------------------------------
// UserRepository
// ----------------------------------------------------------------------------
uint64_t UserRepository::createUser(const User& user) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO users (full_name, email, password_hash, is_verified) VALUES ('"
        << conn.escape(user.full_name) << "', '"
        << conn.escape(user.email) << "', '"
        << conn.escape(user.password_hash) << "', "
        << (user.is_verified ? "1" : "0") << ");";
    conn.execute(oss.str());
    uint64_t uid = conn.lastInsertId();

    // Default user preferences and notification preferences
    std::ostringstream pOss;
    pOss << "INSERT INTO user_preferences (user_id) VALUES (" << uid << ");";
    conn.execute(pOss.str());

    std::ostringstream nOss;
    nOss << "INSERT INTO notification_preferences (user_id) VALUES (" << uid << ");";
    conn.execute(nOss.str());

    return uid;
}

std::optional<User> UserRepository::findByEmail(const std::string& email) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT id, full_name, email, password_hash, is_verified, created_at, updated_at "
        << "FROM users WHERE email = '" << conn.escape(email) << "' LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    User u;
    u.id = r["id"].asUInt64();
    u.full_name = r["full_name"].asString();
    u.email = r["email"].asString();
    u.password_hash = r["password_hash"].asString();
    u.is_verified = (r["is_verified"].asInt() == 1);
    u.created_at = r["created_at"].asString();
    u.updated_at = r["updated_at"].asString();
    return u;
}

std::optional<User> UserRepository::findById(uint64_t id) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT id, full_name, email, password_hash, is_verified, created_at, updated_at "
        << "FROM users WHERE id = " << id << " LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    User u;
    u.id = r["id"].asUInt64();
    u.full_name = r["full_name"].asString();
    u.email = r["email"].asString();
    u.password_hash = r["password_hash"].asString();
    u.is_verified = (r["is_verified"].asInt() == 1);
    u.created_at = r["created_at"].asString();
    u.updated_at = r["updated_at"].asString();
    return u;
}

bool UserRepository::verifyUser(uint64_t id) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE users SET is_verified = 1 WHERE id = " << id << ";";
    return conn.execute(oss.str()) > 0;
}

bool UserRepository::updatePassword(uint64_t id, const std::string& newPasswordHash) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE users SET password_hash = '" << conn.escape(newPasswordHash)
        << "' WHERE id = " << id << ";";
    return conn.execute(oss.str()) > 0;
}

bool UserRepository::updateProfile(uint64_t id, const std::string& fullName) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE users SET full_name = '" << conn.escape(fullName)
        << "' WHERE id = " << id << ";";
    return conn.execute(oss.str()) > 0;
}

void UserRepository::createOtp(uint64_t userId, const std::string& otpHash, const std::string& type, int expiryMinutes) {
    auto conn = db::DbPool::getInstance().getConnection();
    // Invalidate prior unused OTPs for this user & type
    std::ostringstream invOss;
    invOss << "UPDATE otp_verifications SET is_used = 1 WHERE user_id = " << userId
           << " AND otp_type = '" << conn.escape(type) << "';";
    conn.execute(invOss.str());

    std::ostringstream oss;
    oss << "INSERT INTO otp_verifications (user_id, otp_hash, otp_type, expires_at) VALUES ("
        << userId << ", '" << conn.escape(otpHash) << "', '" << conn.escape(type) << "', "
        << "DATE_ADD(NOW(), INTERVAL " << expiryMinutes << " MINUTE));";
    conn.execute(oss.str());
}

bool UserRepository::verifyOtp(uint64_t userId, const std::string& otpHash, const std::string& type) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT id, attempts, max_attempts FROM otp_verifications "
        << "WHERE user_id = " << userId
        << " AND otp_type = '" << conn.escape(type) << "' "
        << " AND is_used = 0 AND expires_at >= NOW() "
        << "ORDER BY id DESC LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return false;

    uint64_t otpId = rows[0]["id"].asUInt64();
    int attempts = rows[0]["attempts"].asInt();
    int maxAttempts = rows[0]["max_attempts"].asInt();

    if (attempts >= maxAttempts) {
        return false;
    }

    // Check hash match
    std::ostringstream matchOss;
    matchOss << "SELECT id FROM otp_verifications WHERE id = " << otpId
             << " AND otp_hash = '" << conn.escape(otpHash) << "';";
    auto matchRows = conn.queryJson(matchOss.str());

    if (!matchRows.empty()) {
        std::ostringstream useOss;
        useOss << "UPDATE otp_verifications SET is_used = 1 WHERE id = " << otpId << ";";
        conn.execute(useOss.str());
        return true;
    } else {
        std::ostringstream incOss;
        incOss << "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = " << otpId << ";";
        conn.execute(incOss.str());
        return false;
    }
}

void UserRepository::createPasswordResetToken(uint64_t userId, const std::string& tokenHash, int expiryMinutes) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ("
        << userId << ", '" << conn.escape(tokenHash) << "', "
        << "DATE_ADD(UTC_TIMESTAMP(), INTERVAL " << expiryMinutes << " MINUTE));";
    conn.execute(oss.str());
}

std::optional<uint64_t> UserRepository::verifyPasswordResetToken(const std::string& tokenHash) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT id, user_id FROM password_reset_tokens "
        << "WHERE token_hash = '" << conn.escape(tokenHash) << "' "
        << "AND is_used = 0 AND expires_at >= UTC_TIMESTAMP() LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    uint64_t tokenId = rows[0]["id"].asUInt64();
    uint64_t userId = rows[0]["user_id"].asUInt64();

    std::ostringstream useOss;
    useOss << "UPDATE password_reset_tokens SET is_used = 1 WHERE id = " << tokenId << ";";
    conn.execute(useOss.str());

    return userId;
}

UserPreferences UserRepository::getPreferences(uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT theme, default_currency, timezone, email_notifications FROM user_preferences WHERE user_id = " << userId << ";";
    auto rows = conn.queryJson(oss.str());
    UserPreferences p;
    p.user_id = userId;
    if (!rows.empty()) {
        p.theme = rows[0]["theme"].asString();
        p.default_currency = rows[0]["default_currency"].asString();
        p.timezone = rows[0]["timezone"].asString();
        p.email_notifications = (rows[0]["email_notifications"].asInt() == 1);
    }
    return p;
}

void UserRepository::updatePreferences(uint64_t userId, const UserPreferences& prefs) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO user_preferences (user_id, theme, default_currency, timezone, email_notifications) VALUES ("
        << userId << ", '" << conn.escape(prefs.theme) << "', '" << conn.escape(prefs.default_currency) << "', '"
        << conn.escape(prefs.timezone) << "', " << (prefs.email_notifications ? "1" : "0") << ") "
        << "ON DUPLICATE KEY UPDATE theme = VALUES(theme), default_currency = VALUES(default_currency), "
        << "timezone = VALUES(timezone), email_notifications = VALUES(email_notifications);";
    conn.execute(oss.str());
}

NotificationPreferences UserRepository::getNotificationPreferences(uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT email_interview_reminders, email_deadline_reminders, email_followup_reminders, email_daily_digest, lead_time_hours "
        << "FROM notification_preferences WHERE user_id = " << userId << ";";
    auto rows = conn.queryJson(oss.str());
    NotificationPreferences p;
    p.user_id = userId;
    if (!rows.empty()) {
        p.email_interview_reminders = (rows[0]["email_interview_reminders"].asInt() == 1);
        p.email_deadline_reminders = (rows[0]["email_deadline_reminders"].asInt() == 1);
        p.email_followup_reminders = (rows[0]["email_followup_reminders"].asInt() == 1);
        p.email_daily_digest = (rows[0]["email_daily_digest"].asInt() == 1);
        p.lead_time_hours = rows[0]["lead_time_hours"].asUInt();
    }
    return p;
}

void UserRepository::updateNotificationPreferences(uint64_t userId, const NotificationPreferences& prefs) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO notification_preferences (user_id, email_interview_reminders, email_deadline_reminders, email_followup_reminders, email_daily_digest, lead_time_hours) VALUES ("
        << userId << ", " << (prefs.email_interview_reminders ? "1" : "0") << ", "
        << (prefs.email_deadline_reminders ? "1" : "0") << ", "
        << (prefs.email_followup_reminders ? "1" : "0") << ", "
        << (prefs.email_daily_digest ? "1" : "0") << ", "
        << prefs.lead_time_hours << ") "
        << "ON DUPLICATE KEY UPDATE email_interview_reminders = VALUES(email_interview_reminders), "
        << "email_deadline_reminders = VALUES(email_deadline_reminders), "
        << "email_followup_reminders = VALUES(email_followup_reminders), "
        << "email_daily_digest = VALUES(email_daily_digest), "
        << "lead_time_hours = VALUES(lead_time_hours);";
    conn.execute(oss.str());
}

// ----------------------------------------------------------------------------
// SessionRepository
// ----------------------------------------------------------------------------
void SessionRepository::createSession(uint64_t userId, const std::string& tokenHash, const std::string& ip, const std::string& userAgent, int expiryDays) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at) VALUES ("
        << userId << ", '" << conn.escape(tokenHash) << "', '" << conn.escape(ip) << "', '"
        << conn.escape(userAgent) << "', DATE_ADD(UTC_TIMESTAMP(), INTERVAL " << expiryDays << " DAY));";
    conn.execute(oss.str());
}

std::optional<uint64_t> SessionRepository::findByTokenHash(const std::string& tokenHash) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT user_id FROM user_sessions WHERE session_token_hash = '" << conn.escape(tokenHash)
        << "' AND expires_at >= UTC_TIMESTAMP() LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    // Update last_active_at
    std::ostringstream actOss;
    actOss << "UPDATE user_sessions SET last_active_at = UTC_TIMESTAMP() WHERE session_token_hash = '"
           << conn.escape(tokenHash) << "';";
    conn.execute(actOss.str());

    return rows[0]["user_id"].asUInt64();
}

void SessionRepository::revokeSession(const std::string& tokenHash) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM user_sessions WHERE session_token_hash = '" << conn.escape(tokenHash) << "';";
    conn.execute(oss.str());
}

void SessionRepository::revokeAllUserSessions(uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM user_sessions WHERE user_id = " << userId << ";";
    conn.execute(oss.str());
}

void SessionRepository::cleanExpiredSessions() {
    auto conn = db::DbPool::getInstance().getConnection();
    conn.execute("DELETE FROM user_sessions WHERE expires_at < UTC_TIMESTAMP();");
}

// ----------------------------------------------------------------------------
// ApplicationRepository
// ----------------------------------------------------------------------------
uint64_t ApplicationRepository::createApplication(const Application& app) {
    auto conn = db::DbPool::getInstance().getConnection();
    db::TransactionGuard tx(conn);

    std::ostringstream oss;
    oss << "INSERT INTO applications (user_id, company_id, company_name, job_title, job_description, job_url, "
        << "location, employment_type, salary_min, salary_max, currency, date_discovered, date_applied, deadline, "
        << "resume_version, cover_letter, notes, status) VALUES ("
        << app.user_id << ", "
        << (app.company_id ? std::to_string(*app.company_id) : "NULL") << ", '"
        << conn.escape(app.company_name) << "', '"
        << conn.escape(app.job_title) << "', "
        << (app.job_description.empty() ? "NULL" : ("'" + conn.escape(app.job_description) + "'")) << ", "
        << (app.job_url.empty() ? "NULL" : ("'" + conn.escape(app.job_url) + "'")) << ", "
        << (app.location.empty() ? "NULL" : ("'" + conn.escape(app.location) + "'")) << ", '"
        << conn.escape(app.employment_type) << "', "
        << (app.salary_min ? std::to_string(*app.salary_min) : "NULL") << ", "
        << (app.salary_max ? std::to_string(*app.salary_max) : "NULL") << ", '"
        << conn.escape(app.currency) << "', "
        << (app.date_discovered.empty() ? "NULL" : ("'" + conn.escape(app.date_discovered) + "'")) << ", "
        << (app.date_applied.empty() ? "NULL" : ("'" + conn.escape(app.date_applied) + "'")) << ", "
        << (app.deadline.empty() ? "NULL" : ("'" + conn.escape(app.deadline) + "'")) << ", "
        << (app.resume_version.empty() ? "NULL" : ("'" + conn.escape(app.resume_version) + "'")) << ", "
        << (app.cover_letter.empty() ? "NULL" : ("'" + conn.escape(app.cover_letter) + "'")) << ", "
        << (app.notes.empty() ? "NULL" : ("'" + conn.escape(app.notes) + "'")) << ", '"
        << conn.escape(app.status) << "');";

    conn.execute(oss.str());
    uint64_t appId = conn.lastInsertId();

    // Log status history
    std::ostringstream hOss;
    hOss << "INSERT INTO application_status_history (application_id, from_status, to_status, notes) VALUES ("
         << appId << ", NULL, '" << conn.escape(app.status) << "', 'Application registered');";
    conn.execute(hOss.str());

    tx.commit();
    return appId;
}

bool ApplicationRepository::updateApplication(const Application& app) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE applications SET "
        << "company_name = '" << conn.escape(app.company_name) << "', "
        << "job_title = '" << conn.escape(app.job_title) << "', "
        << "job_description = " << (app.job_description.empty() ? "NULL" : ("'" + conn.escape(app.job_description) + "'")) << ", "
        << "job_url = " << (app.job_url.empty() ? "NULL" : ("'" + conn.escape(app.job_url) + "'")) << ", "
        << "location = " << (app.location.empty() ? "NULL" : ("'" + conn.escape(app.location) + "'")) << ", "
        << "employment_type = '" << conn.escape(app.employment_type) << "', "
        << "salary_min = " << (app.salary_min ? std::to_string(*app.salary_min) : "NULL") << ", "
        << "salary_max = " << (app.salary_max ? std::to_string(*app.salary_max) : "NULL") << ", "
        << "currency = '" << conn.escape(app.currency) << "', "
        << "deadline = " << (app.deadline.empty() ? "NULL" : ("'" + conn.escape(app.deadline) + "'")) << ", "
        << "notes = " << (app.notes.empty() ? "NULL" : ("'" + conn.escape(app.notes) + "'")) << " "
        << "WHERE id = " << app.id << " AND user_id = " << app.user_id << ";";
    return conn.execute(oss.str()) >= 0;
}

std::optional<Application> ApplicationRepository::findById(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM applications WHERE id = " << id << " AND user_id = " << userId << " LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    Application a;
    a.id = r["id"].asUInt64();
    a.user_id = r["user_id"].asUInt64();
    if (!r["company_id"].isNull()) a.company_id = r["company_id"].asUInt64();
    a.company_name = r["company_name"].asString();
    a.job_title = r["job_title"].asString();
    if (!r["job_description"].isNull()) a.job_description = r["job_description"].asString();
    if (!r["job_url"].isNull()) a.job_url = r["job_url"].asString();
    if (!r["location"].isNull()) a.location = r["location"].asString();
    a.employment_type = r["employment_type"].asString();
    if (!r["salary_min"].isNull()) a.salary_min = r["salary_min"].asDouble();
    if (!r["salary_max"].isNull()) a.salary_max = r["salary_max"].asDouble();
    a.currency = r["currency"].asString();
    if (!r["date_discovered"].isNull()) a.date_discovered = r["date_discovered"].asString();
    if (!r["date_applied"].isNull()) a.date_applied = r["date_applied"].asString();
    if (!r["deadline"].isNull()) a.deadline = r["deadline"].asString();
    if (!r["resume_version"].isNull()) a.resume_version = r["resume_version"].asString();
    if (!r["cover_letter"].isNull()) a.cover_letter = r["cover_letter"].asString();
    if (!r["notes"].isNull()) a.notes = r["notes"].asString();
    a.status = r["status"].asString();
    a.created_at = r["created_at"].asString();
    a.updated_at = r["updated_at"].asString();
    return a;
}

std::vector<Application> ApplicationRepository::listApplications(uint64_t userId, const std::string& status, const std::string& search, const std::string& sortBy, bool desc, size_t offset, size_t limit) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM applications WHERE user_id = " << userId;
    if (!status.empty()) {
        oss << " AND status = '" << conn.escape(status) << "'";
    }
    if (!search.empty()) {
        std::string s = conn.escape(search);
        oss << " AND (company_name LIKE '%" << s << "%' OR job_title LIKE '%" << s << "%' OR location LIKE '%" << s << "%')";
    }

    std::string safeSort = "updated_at";
    if (sortBy == "created_at" || sortBy == "company_name" || sortBy == "salary_max" || sortBy == "deadline") {
        safeSort = sortBy;
    }
    oss << " ORDER BY " << safeSort << (desc ? " DESC " : " ASC ");
    oss << "LIMIT " << limit << " OFFSET " << offset << ";";

    auto rows = conn.queryJson(oss.str());
    std::vector<Application> apps;
    for (const auto& r : rows) {
        Application a;
        a.id = r["id"].asUInt64();
        a.user_id = r["user_id"].asUInt64();
        if (!r["company_id"].isNull()) a.company_id = r["company_id"].asUInt64();
        a.company_name = r["company_name"].asString();
        a.job_title = r["job_title"].asString();
        if (!r["job_description"].isNull()) a.job_description = r["job_description"].asString();
        if (!r["job_url"].isNull()) a.job_url = r["job_url"].asString();
        if (!r["location"].isNull()) a.location = r["location"].asString();
        a.employment_type = r["employment_type"].asString();
        if (!r["salary_min"].isNull()) a.salary_min = r["salary_min"].asDouble();
        if (!r["salary_max"].isNull()) a.salary_max = r["salary_max"].asDouble();
        a.currency = r["currency"].asString();
        if (!r["date_discovered"].isNull()) a.date_discovered = r["date_discovered"].asString();
        if (!r["date_applied"].isNull()) a.date_applied = r["date_applied"].asString();
        if (!r["deadline"].isNull()) a.deadline = r["deadline"].asString();
        if (!r["resume_version"].isNull()) a.resume_version = r["resume_version"].asString();
        if (!r["cover_letter"].isNull()) a.cover_letter = r["cover_letter"].asString();
        if (!r["notes"].isNull()) a.notes = r["notes"].asString();
        a.status = r["status"].asString();
        a.created_at = r["created_at"].asString();
        a.updated_at = r["updated_at"].asString();
        apps.push_back(a);
    }
    return apps;
}

size_t ApplicationRepository::countApplications(uint64_t userId, const std::string& status, const std::string& search) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT COUNT(*) as total FROM applications WHERE user_id = " << userId;
    if (!status.empty()) {
        oss << " AND status = '" << conn.escape(status) << "'";
    }
    if (!search.empty()) {
        std::string s = conn.escape(search);
        oss << " AND (company_name LIKE '%" << s << "%' OR job_title LIKE '%" << s << "%')";
    }
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return 0;
    return rows[0]["total"].asUInt64();
}

bool ApplicationRepository::updateStatus(uint64_t id, uint64_t userId, const std::string& newStatus, const std::string& notes) {
    auto conn = db::DbPool::getInstance().getConnection();
    db::TransactionGuard tx(conn);

    std::ostringstream getOss;
    getOss << "SELECT status FROM applications WHERE id = " << id << " AND user_id = " << userId << " LIMIT 1;";
    auto rows = conn.queryJson(getOss.str());
    if (rows.empty()) return false;
    std::string oldStatus = rows[0]["status"].asString();

    std::ostringstream updOss;
    updOss << "UPDATE applications SET status = '" << conn.escape(newStatus) << "', "
           << "updated_at = UTC_TIMESTAMP() "
           << (newStatus == "APPLIED" ? ", date_applied = COALESCE(date_applied, CURRENT_DATE()) " : " ")
           << "WHERE id = " << id << " AND user_id = " << userId << ";";
    conn.execute(updOss.str());

    std::ostringstream histOss;
    histOss << "INSERT INTO application_status_history (application_id, from_status, to_status, notes) VALUES ("
            << id << ", '" << conn.escape(oldStatus) << "', '" << conn.escape(newStatus) << "', '"
            << conn.escape(notes) << "');";
    conn.execute(histOss.str());

    tx.commit();
    return true;
}

size_t ApplicationRepository::bulkUpdateStatus(uint64_t userId, const std::vector<uint64_t>& appIds, const std::string& newStatus) {
    if (appIds.empty()) return 0;
    size_t count = 0;
    for (uint64_t id : appIds) {
        if (updateStatus(id, userId, newStatus, "Bulk status updated")) {
            count++;
        }
    }
    return count;
}

std::optional<Application> ApplicationRepository::duplicateApplication(uint64_t id, uint64_t userId) {
    auto original = findById(id, userId);
    if (!original) return std::nullopt;

    Application dup = *original;
    dup.job_title += " (Copy)";
    dup.status = "SAVED";
    dup.date_applied = "";
    uint64_t newId = createApplication(dup);
    return findById(newId, userId);
}

bool ApplicationRepository::deleteApplication(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM applications WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

std::vector<ApplicationStatusHistory> ApplicationRepository::getStatusHistory(uint64_t applicationId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT id, application_id, from_status, to_status, notes, changed_at "
        << "FROM application_status_history WHERE application_id = " << applicationId
        << " ORDER BY changed_at ASC;";
    auto rows = conn.queryJson(oss.str());
    std::vector<ApplicationStatusHistory> history;
    for (const auto& r : rows) {
        ApplicationStatusHistory h;
        h.id = r["id"].asUInt64();
        h.application_id = r["application_id"].asUInt64();
        if (!r["from_status"].isNull()) h.from_status = r["from_status"].asString();
        h.to_status = r["to_status"].asString();
        if (!r["notes"].isNull()) h.notes = r["notes"].asString();
        h.changed_at = r["changed_at"].asString();
        history.push_back(h);
    }
    return history;
}

// ----------------------------------------------------------------------------
// CompanyRepository
// ----------------------------------------------------------------------------
uint64_t CompanyRepository::createCompany(const Company& company) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO companies (user_id, name, website, industry, location, recruiter_name, recruiter_email, recruiter_phone, notes) VALUES ("
        << company.user_id << ", '"
        << conn.escape(company.name) << "', "
        << (company.website.empty() ? "NULL" : ("'" + conn.escape(company.website) + "'")) << ", "
        << (company.industry.empty() ? "NULL" : ("'" + conn.escape(company.industry) + "'")) << ", "
        << (company.location.empty() ? "NULL" : ("'" + conn.escape(company.location) + "'")) << ", "
        << (company.recruiter_name.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_name) + "'")) << ", "
        << (company.recruiter_email.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_email) + "'")) << ", "
        << (company.recruiter_phone.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_phone) + "'")) << ", "
        << (company.notes.empty() ? "NULL" : ("'" + conn.escape(company.notes) + "'")) << ");";
    conn.execute(oss.str());
    return conn.lastInsertId();
}

bool CompanyRepository::updateCompany(const Company& company) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE companies SET name = '" << conn.escape(company.name) << "', "
        << "website = " << (company.website.empty() ? "NULL" : ("'" + conn.escape(company.website) + "'")) << ", "
        << "industry = " << (company.industry.empty() ? "NULL" : ("'" + conn.escape(company.industry) + "'")) << ", "
        << "location = " << (company.location.empty() ? "NULL" : ("'" + conn.escape(company.location) + "'")) << ", "
        << "recruiter_name = " << (company.recruiter_name.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_name) + "'")) << ", "
        << "recruiter_email = " << (company.recruiter_email.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_email) + "'")) << ", "
        << "recruiter_phone = " << (company.recruiter_phone.empty() ? "NULL" : ("'" + conn.escape(company.recruiter_phone) + "'")) << ", "
        << "notes = " << (company.notes.empty() ? "NULL" : ("'" + conn.escape(company.notes) + "'")) << " "
        << "WHERE id = " << company.id << " AND user_id = " << company.user_id << ";";
    return conn.execute(oss.str()) >= 0;
}

std::optional<Company> CompanyRepository::findById(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM companies WHERE id = " << id << " AND user_id = " << userId << " LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    Company c;
    c.id = r["id"].asUInt64();
    c.user_id = r["user_id"].asUInt64();
    c.name = r["name"].asString();
    if (!r["website"].isNull()) c.website = r["website"].asString();
    if (!r["industry"].isNull()) c.industry = r["industry"].asString();
    if (!r["location"].isNull()) c.location = r["location"].asString();
    if (!r["recruiter_name"].isNull()) c.recruiter_name = r["recruiter_name"].asString();
    if (!r["recruiter_email"].isNull()) c.recruiter_email = r["recruiter_email"].asString();
    if (!r["recruiter_phone"].isNull()) c.recruiter_phone = r["recruiter_phone"].asString();
    if (!r["notes"].isNull()) c.notes = r["notes"].asString();
    c.created_at = r["created_at"].asString();
    c.updated_at = r["updated_at"].asString();
    return c;
}

std::vector<Company> CompanyRepository::listCompanies(uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT c.*, (SELECT COUNT(*) FROM applications WHERE company_id = c.id) as applications_count "
        << "FROM companies c WHERE c.user_id = " << userId << " ORDER BY c.name ASC;";
    auto rows = conn.queryJson(oss.str());
    std::vector<Company> list;
    for (const auto& r : rows) {
        Company c;
        c.id = r["id"].asUInt64();
        c.user_id = r["user_id"].asUInt64();
        c.name = r["name"].asString();
        if (!r["website"].isNull()) c.website = r["website"].asString();
        if (!r["industry"].isNull()) c.industry = r["industry"].asString();
        if (!r["location"].isNull()) c.location = r["location"].asString();
        if (!r["recruiter_name"].isNull()) c.recruiter_name = r["recruiter_name"].asString();
        if (!r["recruiter_email"].isNull()) c.recruiter_email = r["recruiter_email"].asString();
        if (!r["recruiter_phone"].isNull()) c.recruiter_phone = r["recruiter_phone"].asString();
        if (!r["notes"].isNull()) c.notes = r["notes"].asString();
        c.created_at = r["created_at"].asString();
        c.updated_at = r["updated_at"].asString();
        list.push_back(c);
    }
    return list;
}

bool CompanyRepository::deleteCompany(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM companies WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

// ----------------------------------------------------------------------------
// InterviewRepository
// ----------------------------------------------------------------------------
uint64_t InterviewRepository::createInterview(const Interview& it) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO interviews (user_id, application_id, interview_date, timezone, interview_type, interview_round, meeting_link, interviewer_details, prep_notes, feedback, result) VALUES ("
        << it.user_id << ", " << it.application_id << ", '"
        << conn.escape(it.interview_date) << "', '"
        << conn.escape(it.timezone) << "', '"
        << conn.escape(it.interview_type) << "', "
        << it.interview_round << ", "
        << (it.meeting_link.empty() ? "NULL" : ("'" + conn.escape(it.meeting_link) + "'")) << ", "
        << (it.interviewer_details.empty() ? "NULL" : ("'" + conn.escape(it.interviewer_details) + "'")) << ", "
        << (it.prep_notes.empty() ? "NULL" : ("'" + conn.escape(it.prep_notes) + "'")) << ", "
        << (it.feedback.empty() ? "NULL" : ("'" + conn.escape(it.feedback) + "'")) << ", '"
        << conn.escape(it.result) << "');";
    conn.execute(oss.str());
    return conn.lastInsertId();
}

bool InterviewRepository::updateInterview(const Interview& it) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE interviews SET "
        << "interview_date = '" << conn.escape(it.interview_date) << "', "
        << "timezone = '" << conn.escape(it.timezone) << "', "
        << "interview_type = '" << conn.escape(it.interview_type) << "', "
        << "interview_round = " << it.interview_round << ", "
        << "meeting_link = " << (it.meeting_link.empty() ? "NULL" : ("'" + conn.escape(it.meeting_link) + "'")) << ", "
        << "interviewer_details = " << (it.interviewer_details.empty() ? "NULL" : ("'" + conn.escape(it.interviewer_details) + "'")) << ", "
        << "prep_notes = " << (it.prep_notes.empty() ? "NULL" : ("'" + conn.escape(it.prep_notes) + "'")) << ", "
        << "feedback = " << (it.feedback.empty() ? "NULL" : ("'" + conn.escape(it.feedback) + "'")) << ", "
        << "result = '" << conn.escape(it.result) << "' "
        << "WHERE id = " << it.id << " AND user_id = " << it.user_id << ";";
    return conn.execute(oss.str()) >= 0;
}

std::optional<Interview> InterviewRepository::findById(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT i.*, a.company_name, a.job_title FROM interviews i "
        << "JOIN applications a ON i.application_id = a.id "
        << "WHERE i.id = " << id << " AND i.user_id = " << userId << " LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    Interview it;
    it.id = r["id"].asUInt64();
    it.user_id = r["user_id"].asUInt64();
    it.application_id = r["application_id"].asUInt64();
    it.company_name = r["company_name"].asString();
    it.job_title = r["job_title"].asString();
    it.interview_date = r["interview_date"].asString();
    it.timezone = r["timezone"].asString();
    it.interview_type = r["interview_type"].asString();
    it.interview_round = r["interview_round"].asUInt();
    if (!r["meeting_link"].isNull()) it.meeting_link = r["meeting_link"].asString();
    if (!r["interviewer_details"].isNull()) it.interviewer_details = r["interviewer_details"].asString();
    if (!r["prep_notes"].isNull()) it.prep_notes = r["prep_notes"].asString();
    if (!r["feedback"].isNull()) it.feedback = r["feedback"].asString();
    it.result = r["result"].asString();
    it.created_at = r["created_at"].asString();
    it.updated_at = r["updated_at"].asString();
    return it;
}

std::vector<Interview> InterviewRepository::listInterviews(uint64_t userId, const std::string& from, const std::string& to, bool upcomingOnly) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT i.*, a.company_name, a.job_title FROM interviews i "
        << "JOIN applications a ON i.application_id = a.id "
        << "WHERE i.user_id = " << userId;
    if (upcomingOnly) {
        oss << " AND i.interview_date >= UTC_TIMESTAMP()";
    }
    if (!from.empty()) {
        oss << " AND i.interview_date >= '" << conn.escape(from) << "'";
    }
    if (!to.empty()) {
        oss << " AND i.interview_date <= '" << conn.escape(to) << "'";
    }
    oss << " ORDER BY i.interview_date ASC;";

    auto rows = conn.queryJson(oss.str());
    std::vector<Interview> list;
    for (const auto& r : rows) {
        Interview it;
        it.id = r["id"].asUInt64();
        it.user_id = r["user_id"].asUInt64();
        it.application_id = r["application_id"].asUInt64();
        it.company_name = r["company_name"].asString();
        it.job_title = r["job_title"].asString();
        it.interview_date = r["interview_date"].asString();
        it.timezone = r["timezone"].asString();
        it.interview_type = r["interview_type"].asString();
        it.interview_round = r["interview_round"].asUInt();
        if (!r["meeting_link"].isNull()) it.meeting_link = r["meeting_link"].asString();
        if (!r["interviewer_details"].isNull()) it.interviewer_details = r["interviewer_details"].asString();
        if (!r["prep_notes"].isNull()) it.prep_notes = r["prep_notes"].asString();
        if (!r["feedback"].isNull()) it.feedback = r["feedback"].asString();
        it.result = r["result"].asString();
        it.created_at = r["created_at"].asString();
        it.updated_at = r["updated_at"].asString();
        list.push_back(it);
    }
    return list;
}

bool InterviewRepository::deleteInterview(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM interviews WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

// ----------------------------------------------------------------------------
// DocumentRepository
// ----------------------------------------------------------------------------
uint64_t DocumentRepository::createDocument(const DocumentItem& doc) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO documents (user_id, application_id, document_name, document_type, file_path, file_size_bytes, mime_type) VALUES ("
        << doc.user_id << ", "
        << (doc.application_id ? std::to_string(*doc.application_id) : "NULL") << ", '"
        << conn.escape(doc.document_name) << "', '"
        << conn.escape(doc.document_type) << "', '"
        << conn.escape(doc.file_path) << "', "
        << doc.file_size_bytes << ", '"
        << conn.escape(doc.mime_type) << "');";
    conn.execute(oss.str());
    return conn.lastInsertId();
}

std::optional<DocumentItem> DocumentRepository::findById(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM documents WHERE id = " << id << " AND user_id = " << userId << " LIMIT 1;";
    auto rows = conn.queryJson(oss.str());
    if (rows.empty()) return std::nullopt;

    const auto& r = rows[0];
    DocumentItem d;
    d.id = r["id"].asUInt64();
    d.user_id = r["user_id"].asUInt64();
    if (!r["application_id"].isNull()) d.application_id = r["application_id"].asUInt64();
    d.document_name = r["document_name"].asString();
    d.document_type = r["document_type"].asString();
    d.file_path = r["file_path"].asString();
    d.file_size_bytes = r["file_size_bytes"].asUInt64();
    d.mime_type = r["mime_type"].asString();
    d.created_at = r["created_at"].asString();
    d.updated_at = r["updated_at"].asString();
    return d;
}

std::vector<DocumentItem> DocumentRepository::listDocuments(uint64_t userId, std::optional<uint64_t> applicationId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM documents WHERE user_id = " << userId;
    if (applicationId) {
        oss << " AND application_id = " << *applicationId;
    }
    oss << " ORDER BY created_at DESC;";

    auto rows = conn.queryJson(oss.str());
    std::vector<DocumentItem> docs;
    for (const auto& r : rows) {
        DocumentItem d;
        d.id = r["id"].asUInt64();
        d.user_id = r["user_id"].asUInt64();
        if (!r["application_id"].isNull()) d.application_id = r["application_id"].asUInt64();
        d.document_name = r["document_name"].asString();
        d.document_type = r["document_type"].asString();
        d.file_path = r["file_path"].asString();
        d.file_size_bytes = r["file_size_bytes"].asUInt64();
        d.mime_type = r["mime_type"].asString();
        d.created_at = r["created_at"].asString();
        d.updated_at = r["updated_at"].asString();
        docs.push_back(d);
    }
    return docs;
}

bool DocumentRepository::deleteDocument(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM documents WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

// ----------------------------------------------------------------------------
// ReminderRepository
// ----------------------------------------------------------------------------
uint64_t ReminderRepository::createReminder(const Reminder& rem) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "INSERT INTO reminders (user_id, application_id, interview_id, title, description, reminder_type, due_date) VALUES ("
        << rem.user_id << ", "
        << (rem.application_id ? std::to_string(*rem.application_id) : "NULL") << ", "
        << (rem.interview_id ? std::to_string(*rem.interview_id) : "NULL") << ", '"
        << conn.escape(rem.title) << "', "
        << (rem.description.empty() ? "NULL" : ("'" + conn.escape(rem.description) + "'")) << ", '"
        << conn.escape(rem.reminder_type) << "', '"
        << conn.escape(rem.due_date) << "');";
    conn.execute(oss.str());
    return conn.lastInsertId();
}

std::vector<Reminder> ReminderRepository::listReminders(uint64_t userId, bool includeCompleted) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT r.*, a.company_name, a.job_title FROM reminders r "
        << "LEFT JOIN applications a ON r.application_id = a.id "
        << "WHERE r.user_id = " << userId;
    if (!includeCompleted) {
        oss << " AND r.is_completed = 0";
    }
    oss << " ORDER BY r.due_date ASC;";

    auto rows = conn.queryJson(oss.str());
    std::vector<Reminder> list;
    for (const auto& r : rows) {
        Reminder rem;
        rem.id = r["id"].asUInt64();
        rem.user_id = r["user_id"].asUInt64();
        if (!r["application_id"].isNull()) rem.application_id = r["application_id"].asUInt64();
        if (!r["interview_id"].isNull()) rem.interview_id = r["interview_id"].asUInt64();
        if (!r["company_name"].isNull()) rem.company_name = r["company_name"].asString();
        if (!r["job_title"].isNull()) rem.job_title = r["job_title"].asString();
        rem.title = r["title"].asString();
        if (!r["description"].isNull()) rem.description = r["description"].asString();
        rem.reminder_type = r["reminder_type"].asString();
        rem.due_date = r["due_date"].asString();
        rem.is_completed = (r["is_completed"].asInt() == 1);
        rem.is_sent = (r["is_sent"].asInt() == 1);
        if (!r["sent_at"].isNull()) rem.sent_at = r["sent_at"].asString();
        rem.created_at = r["created_at"].asString();
        rem.updated_at = r["updated_at"].asString();
        list.push_back(rem);
    }
    return list;
}

bool ReminderRepository::toggleComplete(uint64_t id, uint64_t userId, bool isCompleted) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE reminders SET is_completed = " << (isCompleted ? "1" : "0")
        << " WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

bool ReminderRepository::deleteReminder(uint64_t id, uint64_t userId) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "DELETE FROM reminders WHERE id = " << id << " AND user_id = " << userId << ";";
    return conn.execute(oss.str()) > 0;
}

std::vector<Reminder> ReminderRepository::getDueUnsentReminders() {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT r.*, a.company_name, a.job_title FROM reminders r "
        << "LEFT JOIN applications a ON r.application_id = a.id "
        << "WHERE r.is_completed = 0 AND r.is_sent = 0 AND r.due_date <= UTC_TIMESTAMP() "
        << "LIMIT 50;";
    auto rows = conn.queryJson(oss.str());
    std::vector<Reminder> list;
    for (const auto& r : rows) {
        Reminder rem;
        rem.id = r["id"].asUInt64();
        rem.user_id = r["user_id"].asUInt64();
        rem.title = r["title"].asString();
        rem.reminder_type = r["reminder_type"].asString();
        rem.due_date = r["due_date"].asString();
        list.push_back(rem);
    }
    return list;
}

bool ReminderRepository::markSent(uint64_t id) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "UPDATE reminders SET is_sent = 1, sent_at = UTC_TIMESTAMP() WHERE id = " << id << ";";
    return conn.execute(oss.str()) > 0;
}

// ----------------------------------------------------------------------------
// ActivityLogRepository
// ----------------------------------------------------------------------------
void ActivityLogRepository::logActivity(uint64_t userId, const std::string& action, const std::string& entityType, std::optional<uint64_t> entityId, const std::string& details) {
    try {
        auto conn = db::DbPool::getInstance().getConnection();
        std::ostringstream oss;
        std::string jsonExpr;
        if (details.empty()) {
            jsonExpr = "NULL";
        } else {
            std::string escaped = conn.escape(details);
            if (details.front() == '{' && details.back() == '}') {
                jsonExpr = "IF(JSON_VALID('" + escaped + "'), '" + escaped + "', JSON_OBJECT('message', '" + escaped + "'))";
            } else {
                jsonExpr = "JSON_OBJECT('message', '" + escaped + "')";
            }
        }

        oss << "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ("
            << userId << ", '" << conn.escape(action) << "', '" << conn.escape(entityType) << "', "
            << (entityId ? std::to_string(*entityId) : "NULL") << ", "
            << jsonExpr << ");";
        conn.execute(oss.str());
    } catch (const std::exception& e) {
        std::cerr << "[ActivityLogRepository] Warning: Failed to log activity: " << e.what() << std::endl;
    }
}

std::vector<ActivityLog> ActivityLogRepository::listRecentActivity(uint64_t userId, size_t limit) {
    auto conn = db::DbPool::getInstance().getConnection();
    std::ostringstream oss;
    oss << "SELECT * FROM activity_logs WHERE user_id = " << userId
        << " ORDER BY created_at DESC LIMIT " << limit << ";";
    auto rows = conn.queryJson(oss.str());
    std::vector<ActivityLog> list;
    for (const auto& r : rows) {
        ActivityLog act;
        act.id = r["id"].asUInt64();
        act.user_id = r["user_id"].asUInt64();
        act.action = r["action"].asString();
        act.entity_type = r["entity_type"].asString();
        if (!r["entity_id"].isNull()) act.entity_id = r["entity_id"].asUInt64();
        act.created_at = r["created_at"].asString();
        list.push_back(act);
    }
    return list;
}

} // namespace jobpilot::repositories
