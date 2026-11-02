#include "services/Services.h"
#include "utils/CryptoUtils.h"
#include <stdexcept>
#include <iostream>
#include <fstream>
#include <filesystem>
#include <chrono>

namespace jobpilot::services {

namespace fs = std::filesystem;

// ----------------------------------------------------------------------------
// AuthService Implementation
// ----------------------------------------------------------------------------
AuthService::RegisterResult AuthService::registerUser(const std::string& fullName, const std::string& email, const std::string& password) {
    if (fullName.empty() || email.empty() || password.empty()) {
        throw std::invalid_argument("Full name, email and password are required");
    }

    auto existing = userRepo_.findByEmail(email);
    if (existing) {
        throw std::runtime_error("An account with this email address already exists");
    }

    std::string pwdHash = utils::CryptoUtils::hashPassword(password);
    User u;
    u.full_name = fullName;
    u.email = email;
    u.password_hash = pwdHash;
    u.is_verified = false;

    uint64_t uid = userRepo_.createUser(u);

    // Generate secure 6-digit OTP
    std::string rawOtp = utils::CryptoUtils::generateOtp();
    std::string otpHash = utils::CryptoUtils::sha256(rawOtp);
    userRepo_.createOtp(uid, otpHash, "REGISTRATION", 10);

    activityRepo_.logActivity(uid, "USER_REGISTERED", "USER", uid, "Account registration initiated");

    RegisterResult res;
    res.user_id = uid;
    res.email = email;
    res.dev_otp = rawOtp; // Dev adapter helper
    return res;
}

User AuthService::verifyOtp(const std::string& email, const std::string& otp) {
    auto u = userRepo_.findByEmail(email);
    if (!u) {
        throw std::runtime_error("Invalid email address");
    }

    std::string otpHash = utils::CryptoUtils::sha256(otp);
    if (!userRepo_.verifyOtp(u->id, otpHash, "REGISTRATION")) {
        throw std::runtime_error("Invalid or expired verification code");
    }

    userRepo_.verifyUser(u->id);
    u->is_verified = true;
    activityRepo_.logActivity(u->id, "USER_VERIFIED", "USER", u->id, "Email OTP verified successfully");
    return *u;
}

std::string AuthService::resendOtp(const std::string& email) {
    auto u = userRepo_.findByEmail(email);
    if (!u) {
        throw std::runtime_error("No account found with this email");
    }

    std::string rawOtp = utils::CryptoUtils::generateOtp();
    std::string otpHash = utils::CryptoUtils::sha256(rawOtp);
    userRepo_.createOtp(u->id, otpHash, "REGISTRATION", 10);

    activityRepo_.logActivity(u->id, "OTP_RESENT", "USER", u->id, "Verification code resent");
    return rawOtp;
}

AuthService::LoginResult AuthService::login(const std::string& email, const std::string& password, const std::string& ip, const std::string& userAgent) {
    auto u = userRepo_.findByEmail(email);
    if (!u) {
        throw std::runtime_error("Invalid email or password");
    }

    if (!utils::CryptoUtils::verifyPassword(password, u->password_hash)) {
        throw std::runtime_error("Invalid email or password");
    }

    // Generate secure session token (64 hex characters)
    std::string rawToken = utils::CryptoUtils::generateToken(32);
    std::string tokenHash = utils::CryptoUtils::sha256(rawToken);

    sessionRepo_.createSession(u->id, tokenHash, ip, userAgent, 30);
    activityRepo_.logActivity(u->id, "USER_LOGIN", "SESSION", std::nullopt, "User logged in from " + ip);

    LoginResult res;
    res.user = *u;
    res.session_token = rawToken;
    return res;
}

void AuthService::logout(const std::string& sessionToken) {
    std::string tokenHash = utils::CryptoUtils::sha256(sessionToken);
    sessionRepo_.revokeSession(tokenHash);
}

std::optional<uint64_t> AuthService::validateSession(const std::string& sessionToken) {
    if (sessionToken.empty()) return std::nullopt;
    std::string tokenHash = utils::CryptoUtils::sha256(sessionToken);
    return sessionRepo_.findByTokenHash(tokenHash);
}

std::string AuthService::forgotPassword(const std::string& email) {
    auto u = userRepo_.findByEmail(email);
    if (!u) {
        return ""; // Do not disclose whether email exists
    }

    std::string rawToken = utils::CryptoUtils::generateToken(32);
    std::string tokenHash = utils::CryptoUtils::sha256(rawToken);
    userRepo_.createPasswordResetToken(u->id, tokenHash, 30);

    activityRepo_.logActivity(u->id, "PASSWORD_RESET_REQUESTED", "USER", u->id, "Password reset token dispatched");
    return rawToken; // Dev token
}

void AuthService::resetPassword(const std::string& token, const std::string& newPassword) {
    if (newPassword.length() < 8) {
        throw std::invalid_argument("Password must be at least 8 characters");
    }

    std::string tokenHash = utils::CryptoUtils::sha256(token);
    auto userId = userRepo_.verifyPasswordResetToken(tokenHash);
    if (!userId) {
        throw std::runtime_error("Invalid or expired password reset token");
    }

    std::string pwdHash = utils::CryptoUtils::hashPassword(newPassword);
    userRepo_.updatePassword(*userId, pwdHash);

    // Invalidate existing sessions for security
    sessionRepo_.revokeAllUserSessions(*userId);
    activityRepo_.logActivity(*userId, "PASSWORD_RESET_COMPLETED", "USER", *userId, "Password updated successfully");
}

// ----------------------------------------------------------------------------
// ApplicationService Implementation
// ----------------------------------------------------------------------------
uint64_t ApplicationService::createApplication(uint64_t userId, const Application& app) {
    Application copy = app;
    copy.user_id = userId;
    uint64_t id = appRepo_.createApplication(copy);
    activityRepo_.logActivity(userId, "APPLICATION_CREATED", "APPLICATION", id, "Created opportunity at " + app.company_name);
    return id;
}

bool ApplicationService::updateApplication(uint64_t userId, const Application& app) {
    Application copy = app;
    copy.user_id = userId;
    bool ok = appRepo_.updateApplication(copy);
    if (ok) {
        activityRepo_.logActivity(userId, "APPLICATION_UPDATED", "APPLICATION", app.id, "Updated details for " + app.company_name);
    }
    return ok;
}

std::optional<Application> ApplicationService::getApplication(uint64_t id, uint64_t userId) {
    return appRepo_.findById(id, userId);
}

std::pair<std::vector<Application>, size_t> ApplicationService::listApplications(uint64_t userId, const std::string& status, const std::string& search, const std::string& sortBy, bool desc, size_t page, size_t pageSize) {
    size_t offset = (page > 0) ? (page - 1) * pageSize : 0;
    auto items = appRepo_.listApplications(userId, status, search, sortBy, desc, offset, pageSize);
    size_t total = appRepo_.countApplications(userId, status, search);
    return {items, total};
}

bool ApplicationService::updateStatus(uint64_t id, uint64_t userId, const std::string& newStatus, const std::string& notes) {
    bool ok = appRepo_.updateStatus(id, userId, newStatus, notes);
    if (ok) {
        activityRepo_.logActivity(userId, "STATUS_UPDATED", "APPLICATION", id, "Moved to status: " + newStatus);
    }
    return ok;
}

size_t ApplicationService::bulkUpdateStatus(uint64_t userId, const std::vector<uint64_t>& appIds, const std::string& newStatus) {
    size_t updated = appRepo_.bulkUpdateStatus(userId, appIds, newStatus);
    activityRepo_.logActivity(userId, "BULK_STATUS_UPDATED", "APPLICATION", std::nullopt, "Updated " + std::to_string(updated) + " applications to " + newStatus);
    return updated;
}

std::optional<Application> ApplicationService::duplicateApplication(uint64_t id, uint64_t userId) {
    auto res = appRepo_.duplicateApplication(id, userId);
    if (res) {
        activityRepo_.logActivity(userId, "APPLICATION_DUPLICATED", "APPLICATION", res->id, "Duplicated application from #" + std::to_string(id));
    }
    return res;
}

bool ApplicationService::deleteApplication(uint64_t id, uint64_t userId) {
    bool ok = appRepo_.deleteApplication(id, userId);
    if (ok) {
        activityRepo_.logActivity(userId, "APPLICATION_DELETED", "APPLICATION", id, "Deleted application #" + std::to_string(id));
    }
    return ok;
}

std::vector<ApplicationStatusHistory> ApplicationService::getStatusHistory(uint64_t applicationId, uint64_t userId) {
    auto app = appRepo_.findById(applicationId, userId);
    if (!app) return {};
    return appRepo_.getStatusHistory(applicationId);
}

// ----------------------------------------------------------------------------
// CompanyService Implementation
// ----------------------------------------------------------------------------
uint64_t CompanyService::createCompany(uint64_t userId, const Company& company) {
    Company copy = company;
    copy.user_id = userId;
    uint64_t id = companyRepo_.createCompany(copy);
    activityRepo_.logActivity(userId, "COMPANY_CREATED", "COMPANY", id, "Added company: " + company.name);
    return id;
}

bool CompanyService::updateCompany(uint64_t userId, const Company& company) {
    Company copy = company;
    copy.user_id = userId;
    return companyRepo_.updateCompany(copy);
}

std::optional<Company> CompanyService::getCompany(uint64_t id, uint64_t userId) {
    return companyRepo_.findById(id, userId);
}

std::vector<Company> CompanyService::listCompanies(uint64_t userId) {
    return companyRepo_.listCompanies(userId);
}

bool CompanyService::deleteCompany(uint64_t id, uint64_t userId) {
    return companyRepo_.deleteCompany(id, userId);
}

// ----------------------------------------------------------------------------
// InterviewService Implementation
// ----------------------------------------------------------------------------
uint64_t InterviewService::createInterview(uint64_t userId, const Interview& it) {
    Interview copy = it;
    copy.user_id = userId;
    uint64_t id = interviewRepo_.createInterview(copy);

    // Auto-create reminder 24 hours prior to interview
    Reminder rem;
    rem.user_id = userId;
    rem.application_id = it.application_id;
    rem.interview_id = id;
    rem.title = "Upcoming Interview: " + it.interview_type;
    rem.reminder_type = "INTERVIEW";
    rem.due_date = it.interview_date; // Due on interview time
    reminderRepo_.createReminder(rem);

    activityRepo_.logActivity(userId, "INTERVIEW_SCHEDULED", "INTERVIEW", id, "Scheduled " + it.interview_type + " round " + std::to_string(it.interview_round));
    return id;
}

bool InterviewService::updateInterview(uint64_t userId, const Interview& it) {
    Interview copy = it;
    copy.user_id = userId;
    return interviewRepo_.updateInterview(copy);
}

std::optional<Interview> InterviewService::getInterview(uint64_t id, uint64_t userId) {
    return interviewRepo_.findById(id, userId);
}

std::vector<Interview> InterviewService::listInterviews(uint64_t userId, const std::string& from, const std::string& to, bool upcomingOnly) {
    return interviewRepo_.listInterviews(userId, from, to, upcomingOnly);
}

bool InterviewService::deleteInterview(uint64_t id, uint64_t userId) {
    return interviewRepo_.deleteInterview(id, userId);
}

// ----------------------------------------------------------------------------
// DocumentService Implementation
// ----------------------------------------------------------------------------
uint64_t DocumentService::saveDocument(uint64_t userId, std::optional<uint64_t> applicationId, const std::string& originalFilename, const std::string& mimeType, const std::string& fileBytes) {
    // Validate file size (max 15MB)
    if (fileBytes.size() > 15 * 1024 * 1024) {
        throw std::invalid_argument("File size exceeds 15MB limit");
    }

    // Validate extension
    std::string ext = "";
    auto dotPos = originalFilename.find_last_of('.');
    if (dotPos != std::string::npos) {
        ext = originalFilename.substr(dotPos);
    }

    // Generate random file storage name
    std::string safeName = "doc_" + std::to_string(userId) + "_" + utils::CryptoUtils::generateToken(16) + ext;
    fs::path uploadDir = "uploads";
    if (!fs::exists(uploadDir)) {
        fs::create_directories(uploadDir);
    }
    fs::path targetPath = uploadDir / safeName;

    std::ofstream out(targetPath, std::ios::binary);
    if (!out) {
        throw std::runtime_error("Failed to write document to disk");
    }
    out.write(fileBytes.data(), fileBytes.size());
    out.close();

    DocumentItem doc;
    doc.user_id = userId;
    doc.application_id = applicationId;
    doc.document_name = originalFilename;
    doc.file_path = targetPath.string();
    doc.file_size_bytes = fileBytes.size();
    doc.mime_type = mimeType;

    uint64_t docId = docRepo_.createDocument(doc);
    activityRepo_.logActivity(userId, "DOCUMENT_UPLOADED", "DOCUMENT", docId, "Uploaded: " + originalFilename);
    return docId;
}

std::optional<DocumentItem> DocumentService::getDocument(uint64_t id, uint64_t userId) {
    return docRepo_.findById(id, userId);
}

std::vector<DocumentItem> DocumentService::listDocuments(uint64_t userId, std::optional<uint64_t> applicationId) {
    return docRepo_.listDocuments(userId, applicationId);
}

bool DocumentService::deleteDocument(uint64_t id, uint64_t userId) {
    auto doc = docRepo_.findById(id, userId);
    if (!doc) return false;

    // Delete from disk
    if (fs::exists(doc->file_path)) {
        try { fs::remove(doc->file_path); } catch (...) {}
    }

    return docRepo_.deleteDocument(id, userId);
}

// ----------------------------------------------------------------------------
// AnalyticsService Implementation
// ----------------------------------------------------------------------------
Json::Value AnalyticsService::getDashboardMetrics(uint64_t userId) {
    Json::Value j;
    auto conn = db::DbPool::getInstance().getConnection();

    // 1. Total applications
    std::ostringstream totOss;
    totOss << "SELECT COUNT(*) as tot FROM applications WHERE user_id = " << userId << ";";
    auto totRows = conn.queryJson(totOss.str());
    j["total_applications"] = totRows.empty() ? 0 : totRows[0]["tot"].asUInt64();

    // 2. Applications this month
    std::ostringstream moOss;
    moOss << "SELECT COUNT(*) as mtot FROM applications WHERE user_id = " << userId
          << " AND created_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01');";
    auto moRows = conn.queryJson(moOss.str());
    j["applications_this_month"] = moRows.empty() ? 0 : moRows[0]["mtot"].asUInt64();

    // 3. Active interviews
    std::ostringstream intOss;
    intOss << "SELECT COUNT(*) as itot FROM interviews WHERE user_id = " << userId
           << " AND interview_date >= UTC_TIMESTAMP();";
    auto intRows = conn.queryJson(intOss.str());
    j["active_interviews"] = intRows.empty() ? 0 : intRows[0]["itot"].asUInt64();

    // 4. Offers
    std::ostringstream offOss;
    offOss << "SELECT COUNT(*) as oftot FROM applications WHERE user_id = " << userId << " AND status = 'OFFER';";
    auto offRows = conn.queryJson(offOss.str());
    j["offers_received"] = offRows.empty() ? 0 : offRows[0]["oftot"].asUInt64();

    // 5. Rejections
    std::ostringstream rejOss;
    rejOss << "SELECT COUNT(*) as rtot FROM applications WHERE user_id = " << userId << " AND status = 'REJECTED';";
    auto rejRows = conn.queryJson(rejOss.str());
    j["rejections"] = rejRows.empty() ? 0 : rejRows[0]["rtot"].asUInt64();

    // 6. Pipeline distribution
    std::ostringstream distOss;
    distOss << "SELECT status, COUNT(*) as cnt FROM applications WHERE user_id = " << userId << " GROUP BY status;";
    auto distRows = conn.queryJson(distOss.str());
    Json::Value distJson;
    distJson["SAVED"] = 0;
    distJson["APPLIED"] = 0;
    distJson["ASSESSMENT"] = 0;
    distJson["INTERVIEW"] = 0;
    distJson["OFFER"] = 0;
    distJson["REJECTED"] = 0;
    distJson["WITHDRAWN"] = 0;
    for (const auto& r : distRows) {
        distJson[r["status"].asString()] = r["cnt"].asUInt64();
    }
    j["pipeline_distribution"] = distJson;

    // 7. Monthly trends
    std::ostringstream trendOss;
    trendOss << "SELECT DATE_FORMAT(created_at, '%b %Y') as mlabel, COUNT(*) as count "
             << "FROM applications WHERE user_id = " << userId
             << " GROUP BY DATE_FORMAT(created_at, '%Y-%m'), mlabel ORDER BY MIN(created_at) ASC LIMIT 6;";
    auto trendRows = conn.queryJson(trendOss.str());
    Json::Value trendJson(Json::arrayValue);
    for (const auto& r : trendRows) {
        Json::Value item;
        item["month"] = r["mlabel"].asString();
        item["count"] = r["count"].asUInt64();
        trendJson.append(item);
    }
    j["monthly_trends"] = trendJson;

    // 8. Upcoming interviews
    auto upcoming = interviewRepo_.listInterviews(userId, "", "", true);
    Json::Value upJson(Json::arrayValue);
    for (const auto& it : upcoming) {
        upJson.append(it.toJson());
    }
    j["upcoming_interviews"] = upJson;

    // 9. Due reminders
    auto reminders = reminderRepo_.listReminders(userId, false);
    Json::Value remJson(Json::arrayValue);
    for (const auto& r : reminders) {
        remJson.append(r.toJson());
    }
    j["pending_reminders"] = remJson;

    // 10. Recent activity
    auto activities = activityRepo_.listRecentActivity(userId, 6);
    Json::Value actJson(Json::arrayValue);
    for (const auto& a : activities) {
        actJson.append(a.toJson());
    }
    j["recent_activity"] = actJson;

    return j;
}

Json::Value AnalyticsService::getAnalyticsMetrics(uint64_t userId) {
    Json::Value j;
    auto conn = db::DbPool::getInstance().getConnection();

    // Total counts
    std::ostringstream totOss;
    totOss << "SELECT COUNT(*) as tot FROM applications WHERE user_id = " << userId << ";";
    auto totRows = conn.queryJson(totOss.str());
    uint64_t total = totRows.empty() ? 0 : totRows[0]["tot"].asUInt64();
    j["total_applications"] = total;

    // Count by statuses
    std::ostringstream scOss;
    scOss << "SELECT status, COUNT(*) as cnt FROM applications WHERE user_id = " << userId << " GROUP BY status;";
    auto scRows = conn.queryJson(scOss.str());

    uint64_t applied = 0, interview = 0, offer = 0, rejected = 0;
    Json::Value byStatus(Json::arrayValue);
    for (const auto& r : scRows) {
        std::string st = r["status"].asString();
        uint64_t cnt = r["cnt"].asUInt64();
        if (st == "APPLIED") applied = cnt;
        if (st == "INTERVIEW") interview = cnt;
        if (st == "OFFER") offer = cnt;
        if (st == "REJECTED") rejected = cnt;

        Json::Value item;
        item["status"] = st;
        item["count"] = cnt;
        byStatus.append(item);
    }
    j["applications_by_status"] = byStatus;

    // Conversion rates
    double appToInterviewRate = (applied > 0) ? (static_cast<double>(interview) / applied * 100.0) : 0.0;
    double interviewToOfferRate = (interview > 0) ? (static_cast<double>(offer) / interview * 100.0) : 0.0;
    double overallOfferRate = (total > 0) ? (static_cast<double>(offer) / total * 100.0) : 0.0;
    double rejectionRate = (total > 0) ? (static_cast<double>(rejected) / total * 100.0) : 0.0;

    j["application_to_interview_rate"] = appToInterviewRate;
    j["interview_to_offer_rate"] = interviewToOfferRate;
    j["overall_offer_rate"] = overallOfferRate;
    j["rejection_rate"] = rejectionRate;

    // Top companies
    std::ostringstream compOss;
    compOss << "SELECT company_name, COUNT(*) as count FROM applications WHERE user_id = " << userId
            << " GROUP BY company_name ORDER BY count DESC LIMIT 5;";
    auto compRows = conn.queryJson(compOss.str());
    Json::Value topComps(Json::arrayValue);
    for (const auto& r : compRows) {
        Json::Value c;
        c["company_name"] = r["company_name"].asString();
        c["count"] = r["count"].asUInt64();
        topComps.append(c);
    }
    j["top_companies"] = topComps;

    // Monthly trends
    std::ostringstream trendOss;
    trendOss << "SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count "
             << "FROM applications WHERE user_id = " << userId
             << " GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month ORDER BY MIN(created_at) ASC LIMIT 12;";
    auto trendRows = conn.queryJson(trendOss.str());
    Json::Value monthly(Json::arrayValue);
    for (const auto& r : trendRows) {
        Json::Value m;
        m["month"] = r["month"].asString();
        m["count"] = r["count"].asUInt64();
        monthly.append(m);
    }
    j["monthly_applications"] = monthly;

    // Interviews by result
    std::ostringstream resOss;
    resOss << "SELECT result, COUNT(*) as count FROM interviews WHERE user_id = " << userId
           << " GROUP BY result;";
    auto resRows = conn.queryJson(resOss.str());
    Json::Value byResult(Json::arrayValue);
    for (const auto& r : resRows) {
        Json::Value it;
        it["result"] = r["result"].asString();
        it["count"] = r["count"].asUInt64();
        byResult.append(it);
    }
    j["interviews_by_result"] = byResult;

    return j;
}

Json::Value AnalyticsService::exportUserData(uint64_t userId) {
    Json::Value root;
    auto user = userRepo_.findById(userId);
    if (!user) return root;

    root["user"] = user->toJson();
    root["preferences"] = userRepo_.getPreferences(userId).toJson();
    root["notification_preferences"] = userRepo_.getNotificationPreferences(userId).toJson();

    auto apps = appRepo_.listApplications(userId, "", "", "created_at", false, 0, 1000);
    Json::Value appsArr(Json::arrayValue);
    for (const auto& a : apps) appsArr.append(a.toJson());
    root["applications"] = appsArr;

    auto comps = companyRepo_.listCompanies(userId);
    Json::Value compsArr(Json::arrayValue);
    for (const auto& c : comps) compsArr.append(c.toJson());
    root["companies"] = compsArr;

    auto interviews = interviewRepo_.listInterviews(userId, "", "", false);
    Json::Value intsArr(Json::arrayValue);
    for (const auto& i : interviews) intsArr.append(i.toJson());
    root["interviews"] = intsArr;

    auto reminders = reminderRepo_.listReminders(userId, true);
    Json::Value remsArr(Json::arrayValue);
    for (const auto& r : reminders) remsArr.append(r.toJson());
    root["reminders"] = remsArr;

    return root;
}

// ----------------------------------------------------------------------------
// ReminderWorker Implementation
// ----------------------------------------------------------------------------
ReminderWorker& ReminderWorker::getInstance() {
    static ReminderWorker worker;
    return worker;
}

ReminderWorker::~ReminderWorker() {
    stop();
}

void ReminderWorker::start() {
    if (running_) return;
    running_ = true;
    workerThread_ = std::thread(&ReminderWorker::run, this);
}

void ReminderWorker::stop() {
    if (!running_) return;
    running_ = false;
    if (workerThread_.joinable()) {
        workerThread_.join();
    }
}

void ReminderWorker::run() {
    while (running_) {
        try {
            auto dueList = reminderRepo_.getDueUnsentReminders();
            for (const auto& rem : dueList) {
                // In development / production, log dispatch and mark sent
                std::cout << "[ReminderWorker] Dispatched alert for reminder #" << rem.id
                          << " Title: " << rem.title << " Due: " << rem.due_date << std::endl;
                reminderRepo_.markSent(rem.id);
            }
        } catch (const std::exception& e) {
            std::cerr << "[ReminderWorker] Error in loop: " << e.what() << std::endl;
        }

        // Sleep 30 seconds
        for (int i = 0; i < 30 && running_; ++i) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
}

} // namespace jobpilot::services
