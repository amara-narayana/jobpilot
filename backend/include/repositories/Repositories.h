#pragma once

#include "models/Models.h"
#include "utils/DbPool.h"
#include <optional>
#include <vector>

namespace jobpilot::repositories {

using namespace jobpilot::models;

class UserRepository {
public:
    uint64_t createUser(const User& user);
    std::optional<User> findByEmail(const std::string& email);
    std::optional<User> findById(uint64_t id);
    bool verifyUser(uint64_t id);
    bool updatePassword(uint64_t id, const std::string& newPasswordHash);
    bool updateProfile(uint64_t id, const std::string& fullName);

    void createOtp(uint64_t userId, const std::string& otpHash, const std::string& type, int expiryMinutes = 5);
    bool verifyOtp(uint64_t userId, const std::string& otpHash, const std::string& type);

    void createPasswordResetToken(uint64_t userId, const std::string& tokenHash, int expiryMinutes = 30);
    std::optional<uint64_t> verifyPasswordResetToken(const std::string& tokenHash);

    UserPreferences getPreferences(uint64_t userId);
    void updatePreferences(uint64_t userId, const UserPreferences& prefs);

    NotificationPreferences getNotificationPreferences(uint64_t userId);
    void updateNotificationPreferences(uint64_t userId, const NotificationPreferences& prefs);
};

class SessionRepository {
public:
    void createSession(uint64_t userId, const std::string& tokenHash, const std::string& ip, const std::string& userAgent, int expiryDays = 30);
    std::optional<uint64_t> findByTokenHash(const std::string& tokenHash);
    void revokeSession(const std::string& tokenHash);
    void revokeAllUserSessions(uint64_t userId);
    void cleanExpiredSessions();
};

class ApplicationRepository {
public:
    uint64_t createApplication(const Application& app);
    bool updateApplication(const Application& app);
    std::optional<Application> findById(uint64_t id, uint64_t userId);
    std::vector<Application> listApplications(uint64_t userId, const std::string& status, const std::string& search, const std::string& sortBy, bool desc, size_t offset, size_t limit);
    size_t countApplications(uint64_t userId, const std::string& status, const std::string& search);
    bool updateStatus(uint64_t id, uint64_t userId, const std::string& newStatus, const std::string& notes);
    size_t bulkUpdateStatus(uint64_t userId, const std::vector<uint64_t>& appIds, const std::string& newStatus);
    std::optional<Application> duplicateApplication(uint64_t id, uint64_t userId);
    bool deleteApplication(uint64_t id, uint64_t userId);
    std::vector<ApplicationStatusHistory> getStatusHistory(uint64_t applicationId);
};

class CompanyRepository {
public:
    uint64_t createCompany(const Company& company);
    bool updateCompany(const Company& company);
    std::optional<Company> findById(uint64_t id, uint64_t userId);
    std::vector<Company> listCompanies(uint64_t userId);
    bool deleteCompany(uint64_t id, uint64_t userId);
};

class InterviewRepository {
public:
    uint64_t createInterview(const Interview& interview);
    bool updateInterview(const Interview& interview);
    std::optional<Interview> findById(uint64_t id, uint64_t userId);
    std::vector<Interview> listInterviews(uint64_t userId, const std::string& from, const std::string& to, bool upcomingOnly);
    bool deleteInterview(uint64_t id, uint64_t userId);
};

class DocumentRepository {
public:
    uint64_t createDocument(const DocumentItem& doc);
    std::optional<DocumentItem> findById(uint64_t id, uint64_t userId);
    std::vector<DocumentItem> listDocuments(uint64_t userId, std::optional<uint64_t> applicationId);
    bool deleteDocument(uint64_t id, uint64_t userId);
};

class ReminderRepository {
public:
    uint64_t createReminder(const Reminder& reminder);
    std::vector<Reminder> listReminders(uint64_t userId, bool includeCompleted);
    bool toggleComplete(uint64_t id, uint64_t userId, bool isCompleted);
    bool deleteReminder(uint64_t id, uint64_t userId);
    std::vector<Reminder> getDueUnsentReminders();
    bool markSent(uint64_t id);
};

class ActivityLogRepository {
public:
    void logActivity(uint64_t userId, const std::string& action, const std::string& entityType, std::optional<uint64_t> entityId, const std::string& details = "");
    std::vector<ActivityLog> listRecentActivity(uint64_t userId, size_t limit = 10);
};

} // namespace jobpilot::repositories
