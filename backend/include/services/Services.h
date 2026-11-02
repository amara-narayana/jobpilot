#pragma once

#include "models/Models.h"
#include "repositories/Repositories.h"
#include <string>
#include <optional>
#include <vector>
#include <thread>
#include <atomic>

namespace jobpilot::services {

using namespace jobpilot::models;
using namespace jobpilot::repositories;

class AuthService {
public:
    struct RegisterResult {
        uint64_t user_id = 0;
        std::string email;
        std::string dev_otp; // Populated only in dev mode for convenient testing
    };

    struct LoginResult {
        User user;
        std::string session_token;
    };

    RegisterResult registerUser(const std::string& fullName, const std::string& email, const std::string& password);
    User verifyOtp(const std::string& email, const std::string& otp);
    std::string resendOtp(const std::string& email); // returns dev_otp
    LoginResult login(const std::string& email, const std::string& password, const std::string& ip, const std::string& userAgent);
    LoginResult createSessionForUser(const User& user, const std::string& ip, const std::string& userAgent);
    void logout(const std::string& sessionToken);
    std::optional<uint64_t> validateSession(const std::string& sessionToken);
    std::string forgotPassword(const std::string& email); // returns dev_token
    void resetPassword(const std::string& token, const std::string& newPassword);

private:
    UserRepository userRepo_;
    SessionRepository sessionRepo_;
    ActivityLogRepository activityRepo_;
};

class ApplicationService {
public:
    uint64_t createApplication(uint64_t userId, const Application& app);
    bool updateApplication(uint64_t userId, const Application& app);
    std::optional<Application> getApplication(uint64_t id, uint64_t userId);
    std::pair<std::vector<Application>, size_t> listApplications(uint64_t userId, const std::string& status, const std::string& search, const std::string& sortBy, bool desc, size_t page, size_t pageSize);
    bool updateStatus(uint64_t id, uint64_t userId, const std::string& newStatus, const std::string& notes);
    size_t bulkUpdateStatus(uint64_t userId, const std::vector<uint64_t>& appIds, const std::string& newStatus);
    std::optional<Application> duplicateApplication(uint64_t id, uint64_t userId);
    bool deleteApplication(uint64_t id, uint64_t userId);
    std::vector<ApplicationStatusHistory> getStatusHistory(uint64_t applicationId, uint64_t userId);

private:
    ApplicationRepository appRepo_;
    ActivityLogRepository activityRepo_;
};

class CompanyService {
public:
    uint64_t createCompany(uint64_t userId, const Company& company);
    bool updateCompany(uint64_t userId, const Company& company);
    std::optional<Company> getCompany(uint64_t id, uint64_t userId);
    std::vector<Company> listCompanies(uint64_t userId);
    bool deleteCompany(uint64_t id, uint64_t userId);

private:
    CompanyRepository companyRepo_;
    ActivityLogRepository activityRepo_;
};

class InterviewService {
public:
    uint64_t createInterview(uint64_t userId, const Interview& it);
    bool updateInterview(uint64_t userId, const Interview& it);
    std::optional<Interview> getInterview(uint64_t id, uint64_t userId);
    std::vector<Interview> listInterviews(uint64_t userId, const std::string& from, const std::string& to, bool upcomingOnly);
    bool deleteInterview(uint64_t id, uint64_t userId);

private:
    InterviewRepository interviewRepo_;
    ReminderRepository reminderRepo_;
    ActivityLogRepository activityRepo_;
};

class DocumentService {
public:
    uint64_t saveDocument(uint64_t userId, std::optional<uint64_t> applicationId, const std::string& originalFilename, const std::string& mimeType, const std::string& fileBytes);
    std::optional<DocumentItem> getDocument(uint64_t id, uint64_t userId);
    std::vector<DocumentItem> listDocuments(uint64_t userId, std::optional<uint64_t> applicationId);
    bool deleteDocument(uint64_t id, uint64_t userId);

private:
    DocumentRepository docRepo_;
    ActivityLogRepository activityRepo_;
};

class AnalyticsService {
public:
    Json::Value getDashboardMetrics(uint64_t userId);
    Json::Value getAnalyticsMetrics(uint64_t userId);
    Json::Value exportUserData(uint64_t userId);

private:
    UserRepository userRepo_;
    ApplicationRepository appRepo_;
    CompanyRepository companyRepo_;
    InterviewRepository interviewRepo_;
    DocumentRepository docRepo_;
    ReminderRepository reminderRepo_;
    ActivityLogRepository activityRepo_;
};

class ReminderWorker {
public:
    static ReminderWorker& getInstance();
    void start();
    void stop();

private:
    ReminderWorker() = default;
    ~ReminderWorker();
    void run();

    std::thread workerThread_;
    std::atomic<bool> running_{false};
    ReminderRepository reminderRepo_;
};

} // namespace jobpilot::services
