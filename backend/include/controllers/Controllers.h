#pragma once

#include <drogon/HttpController.h>
#include "services/Services.h"

namespace jobpilot::controllers {

using namespace drogon;
using namespace jobpilot::services;

class AuthController : public HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuthController::registerUser, "/api/v1/auth/register", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::verifyOtp, "/api/v1/auth/verify-otp", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::resendOtp, "/api/v1/auth/resend-otp", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::login, "/api/v1/auth/login", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::logout, "/api/v1/auth/logout", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::getCurrentUser, "/api/v1/auth/me", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(AuthController::forgotPassword, "/api/v1/auth/forgot-password", Post, Options, "jobpilot::middleware::CorsFilter");
    ADD_METHOD_TO(AuthController::resetPassword, "/api/v1/auth/reset-password", Post, Options, "jobpilot::middleware::CorsFilter");
    METHOD_LIST_END

    void registerUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void verifyOtp(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void resendOtp(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void login(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void logout(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getCurrentUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void forgotPassword(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void resetPassword(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);

private:
    AuthService authService_;
    UserRepository userRepo_;
};

class ApplicationController : public HttpController<ApplicationController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ApplicationController::listApplications, "/api/v1/applications", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::createApplication, "/api/v1/applications", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::getApplication, "/api/v1/applications/{1}", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::updateApplication, "/api/v1/applications/{1}", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::deleteApplication, "/api/v1/applications/{1}", Delete, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::updateStatus, "/api/v1/applications/{1}/status", Patch, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::bulkUpdateStatus, "/api/v1/applications/bulk-status", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::duplicateApplication, "/api/v1/applications/{1}/duplicate", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ApplicationController::getStatusHistory, "/api/v1/applications/{1}/history", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void listApplications(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void createApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void updateApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void deleteApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void updateStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void bulkUpdateStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void duplicateApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void getStatusHistory(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);

private:
    ApplicationService appService_;
};

class CompanyController : public HttpController<CompanyController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(CompanyController::listCompanies, "/api/v1/companies", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(CompanyController::createCompany, "/api/v1/companies", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(CompanyController::getCompany, "/api/v1/companies/{1}", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(CompanyController::updateCompany, "/api/v1/companies/{1}", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(CompanyController::deleteCompany, "/api/v1/companies/{1}", Delete, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void listCompanies(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void createCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void updateCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void deleteCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);

private:
    CompanyService companyService_;
};

class InterviewController : public HttpController<InterviewController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(InterviewController::listInterviews, "/api/v1/interviews", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(InterviewController::createInterview, "/api/v1/interviews", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(InterviewController::getInterview, "/api/v1/interviews/{1}", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(InterviewController::updateInterview, "/api/v1/interviews/{1}", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(InterviewController::deleteInterview, "/api/v1/interviews/{1}", Delete, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void listInterviews(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void createInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void updateInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void deleteInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);

private:
    InterviewService interviewService_;
};

class DocumentController : public HttpController<DocumentController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(DocumentController::listDocuments, "/api/v1/documents", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(DocumentController::uploadDocument, "/api/v1/documents/upload", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(DocumentController::downloadDocument, "/api/v1/documents/{1}/download", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(DocumentController::deleteDocument, "/api/v1/documents/{1}", Delete, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void listDocuments(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void uploadDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void downloadDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void deleteDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);

private:
    DocumentService docService_;
};

class AnalyticsController : public HttpController<AnalyticsController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AnalyticsController::getDashboard, "/api/v1/dashboard", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(AnalyticsController::getAnalytics, "/api/v1/analytics", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(AnalyticsController::getAnalytics, "/api/v1/analytics/overview", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(AnalyticsController::exportData, "/api/v1/user/export", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void getDashboard(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getAnalytics(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void exportData(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);

private:
    AnalyticsService analyticsService_;
};

class ReminderController : public HttpController<ReminderController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ReminderController::listReminders, "/api/v1/reminders", Get, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ReminderController::createReminder, "/api/v1/reminders", Post, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ReminderController::toggleComplete, "/api/v1/reminders/{1}/complete", Patch, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(ReminderController::deleteReminder, "/api/v1/reminders/{1}", Delete, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void listReminders(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void createReminder(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void toggleComplete(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);
    void deleteReminder(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id);

private:
    ReminderRepository reminderRepo_;
};

class UserController : public HttpController<UserController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(UserController::updateProfile, "/api/v1/user/profile", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(UserController::updatePreferences, "/api/v1/user/preferences", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    ADD_METHOD_TO(UserController::updateNotificationPreferences, "/api/v1/user/notification-preferences", Put, Options, "jobpilot::middleware::CorsFilter", "jobpilot::middleware::AuthFilter");
    METHOD_LIST_END

    void updateProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void updatePreferences(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void updateNotificationPreferences(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);

private:
    UserRepository userRepo_;
};

} // namespace jobpilot::controllers
