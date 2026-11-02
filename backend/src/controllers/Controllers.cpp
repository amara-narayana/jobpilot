#include "controllers/Controllers.h"
#include <drogon/MultiPart.h>
#include <iostream>

namespace jobpilot::controllers {

// Helper to return standardized JSON response
static HttpResponsePtr makeJson(bool success, const Json::Value& data, const std::string& error = "", HttpStatusCode code = k200OK) {
    Json::Value root;
    root["success"] = success;
    if (success) {
        root["data"] = data;
    } else {
        root["error"] = error;
    }
    auto resp = HttpResponse::newHttpJsonResponse(root);
    resp->setStatusCode(code);
    return resp;
}

// ----------------------------------------------------------------------------
// AuthController
// ----------------------------------------------------------------------------
void AuthController::registerUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("email") || !json->isMember("password") || !json->isMember("full_name")) {
        callback(makeJson(false, Json::nullValue, "Missing required registration parameters", k400BadRequest));
        return;
    }

    try {
        auto res = authService_.registerUser(
            (*json)["full_name"].asString(),
            (*json)["email"].asString(),
            (*json)["password"].asString()
        );
        Json::Value data;
        data["user_id"] = static_cast<Json::UInt64>(res.user_id);
        data["email"] = res.email;
        data["dev_otp"] = res.dev_otp;
        callback(makeJson(true, data, "", k201Created));
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k400BadRequest));
    }
}

void AuthController::verifyOtp(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("email") || !json->isMember("otp")) {
        callback(makeJson(false, Json::nullValue, "Email and 6-digit OTP code are required", k400BadRequest));
        return;
    }

    try {
        User u = authService_.verifyOtp((*json)["email"].asString(), (*json)["otp"].asString());
        
        // Auto-login after verification
        std::string ip = req->peerAddr().toIp();
        auto loginRes = authService_.login((*json)["email"].asString(), "", ip, req->getHeader("User-Agent"));
        
        Json::Value data;
        data["user"] = u.toJson();
        auto resp = makeJson(true, data);
        
        Cookie c("jobpilot_session", loginRes.session_token);
        c.setPath("/");
        c.setHttpOnly(true);
        c.setMaxAge(30 * 86400);
        resp->addCookie(c);
        callback(resp);
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k400BadRequest));
    }
}

void AuthController::resendOtp(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("email")) {
        callback(makeJson(false, Json::nullValue, "Email is required", k400BadRequest));
        return;
    }

    try {
        std::string devOtp = authService_.resendOtp((*json)["email"].asString());
        Json::Value data;
        data["message"] = "Verification code resent";
        data["dev_otp"] = devOtp;
        callback(makeJson(true, data));
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k400BadRequest));
    }
}

void AuthController::login(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("email") || !json->isMember("password")) {
        callback(makeJson(false, Json::nullValue, "Email and password are required", k400BadRequest));
        return;
    }

    try {
        std::string ip = req->peerAddr().toIp();
        auto res = authService_.login(
            (*json)["email"].asString(),
            (*json)["password"].asString(),
            ip,
            req->getHeader("User-Agent")
        );

        Json::Value data;
        data["user"] = res.user.toJson();
        auto resp = makeJson(true, data);

        Cookie cookie("jobpilot_session", res.session_token);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(30 * 86400);
        resp->addCookie(cookie);

        callback(resp);
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k401Unauthorized));
    }
}

void AuthController::logout(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    std::string token = req->getCookie("jobpilot_session");
    if (!token.empty()) {
        authService_.logout(token);
    }

    auto resp = makeJson(true, Json::Value(true));
    Cookie cookie("jobpilot_session", "");
    cookie.setPath("/");
    cookie.setMaxAge(0);
    resp->addCookie(cookie);
    callback(resp);
}

void AuthController::getCurrentUser(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto u = userRepo_.findById(userId);
    if (!u) {
        callback(makeJson(false, Json::nullValue, "User not found", k404NotFound));
        return;
    }

    Json::Value data;
    data["user"] = u->toJson();
    data["preferences"] = userRepo_.getPreferences(userId).toJson();
    data["notification_preferences"] = userRepo_.getNotificationPreferences(userId).toJson();
    callback(makeJson(true, data));
}

void AuthController::forgotPassword(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("email")) {
        callback(makeJson(false, Json::nullValue, "Email is required", k400BadRequest));
        return;
    }

    std::string devToken = authService_.forgotPassword((*json)["email"].asString());
    Json::Value data;
    data["message"] = "If the account exists, instructions have been dispatched";
    data["dev_token"] = devToken;
    callback(makeJson(true, data));
}

void AuthController::resetPassword(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("token") || !json->isMember("password")) {
        callback(makeJson(false, Json::nullValue, "Token and new password are required", k400BadRequest));
        return;
    }

    try {
        authService_.resetPassword((*json)["token"].asString(), (*json)["password"].asString());
        Json::Value data;
        data["message"] = "Password has been reset successfully";
        callback(makeJson(true, data));
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k400BadRequest));
    }
}

// ----------------------------------------------------------------------------
// ApplicationController
// ----------------------------------------------------------------------------
void ApplicationController::listApplications(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    std::string status = req->getParameter("status");
    std::string search = req->getParameter("search");
    std::string sortBy = req->getParameter("sort_by");
    std::string sortOrder = req->getParameter("sort_order");
    bool desc = (sortOrder != "asc");

    size_t page = 1;
    size_t pageSize = 50;
    try {
        if (!req->getParameter("page").empty()) page = std::stoul(req->getParameter("page"));
        if (!req->getParameter("page_size").empty()) pageSize = std::stoul(req->getParameter("page_size"));
    } catch (...) {}

    auto [items, total] = appService_.listApplications(userId, status, search, sortBy, desc, page, pageSize);

    Json::Value data;
    Json::Value itemsArr(Json::arrayValue);
    for (const auto& a : items) itemsArr.append(a.toJson());
    data["items"] = itemsArr;
    data["total"] = static_cast<Json::UInt64>(total);
    data["page"] = static_cast<Json::UInt64>(page);
    data["page_size"] = static_cast<Json::UInt64>(pageSize);
    data["total_pages"] = static_cast<Json::UInt64>((total + pageSize - 1) / pageSize);

    callback(makeJson(true, data));
}

void ApplicationController::createApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("company_name") || !json->isMember("job_title")) {
        callback(makeJson(false, Json::nullValue, "Company name and job title are required", k400BadRequest));
        return;
    }

    Application a;
    a.user_id = userId;
    a.company_name = (*json)["company_name"].asString();
    a.job_title = (*json)["job_title"].asString();
    if (json->isMember("job_description")) a.job_description = (*json)["job_description"].asString();
    if (json->isMember("job_url")) a.job_url = (*json)["job_url"].asString();
    if (json->isMember("location")) a.location = (*json)["location"].asString();
    if (json->isMember("employment_type")) a.employment_type = (*json)["employment_type"].asString();
    if (json->isMember("salary_min") && !(*json)["salary_min"].isNull()) a.salary_min = (*json)["salary_min"].asDouble();
    if (json->isMember("salary_max") && !(*json)["salary_max"].isNull()) a.salary_max = (*json)["salary_max"].asDouble();
    if (json->isMember("currency")) a.currency = (*json)["currency"].asString();
    if (json->isMember("date_discovered")) a.date_discovered = (*json)["date_discovered"].asString();
    if (json->isMember("date_applied")) a.date_applied = (*json)["date_applied"].asString();
    if (json->isMember("deadline")) a.deadline = (*json)["deadline"].asString();
    if (json->isMember("resume_version")) a.resume_version = (*json)["resume_version"].asString();
    if (json->isMember("cover_letter")) a.cover_letter = (*json)["cover_letter"].asString();
    if (json->isMember("notes")) a.notes = (*json)["notes"].asString();
    if (json->isMember("status")) a.status = (*json)["status"].asString();

    uint64_t id = appService_.createApplication(userId, a);
    auto created = appService_.getApplication(id, userId);
    callback(makeJson(true, created ? created->toJson() : Json::nullValue, "", k201Created));
}

void ApplicationController::getApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto app = appService_.getApplication(id, userId);
    if (!app) {
        callback(makeJson(false, Json::nullValue, "Application not found", k404NotFound));
        return;
    }
    callback(makeJson(true, app->toJson()));
}

void ApplicationController::updateApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto app = appService_.getApplication(id, userId);
    if (!app) {
        callback(makeJson(false, Json::nullValue, "Application not found", k404NotFound));
        return;
    }

    auto json = req->getJsonObject();
    if (json) {
        if (json->isMember("company_name")) app->company_name = (*json)["company_name"].asString();
        if (json->isMember("job_title")) app->job_title = (*json)["job_title"].asString();
        if (json->isMember("job_description")) app->job_description = (*json)["job_description"].asString();
        if (json->isMember("job_url")) app->job_url = (*json)["job_url"].asString();
        if (json->isMember("location")) app->location = (*json)["location"].asString();
        if (json->isMember("employment_type")) app->employment_type = (*json)["employment_type"].asString();
        if (json->isMember("salary_min")) {
            if ((*json)["salary_min"].isNull()) app->salary_min = std::nullopt;
            else app->salary_min = (*json)["salary_min"].asDouble();
        }
        if (json->isMember("salary_max")) {
            if ((*json)["salary_max"].isNull()) app->salary_max = std::nullopt;
            else app->salary_max = (*json)["salary_max"].asDouble();
        }
        if (json->isMember("currency")) app->currency = (*json)["currency"].asString();
        if (json->isMember("deadline")) app->deadline = (*json)["deadline"].asString();
        if (json->isMember("notes")) app->notes = (*json)["notes"].asString();
        appService_.updateApplication(userId, *app);
    }

    callback(makeJson(true, app->toJson()));
}

void ApplicationController::deleteApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool ok = appService_.deleteApplication(id, userId);
    if (!ok) {
        callback(makeJson(false, Json::nullValue, "Application not found or delete failed", k404NotFound));
        return;
    }
    callback(makeJson(true, Json::Value(true)));
}

void ApplicationController::updateStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("status")) {
        callback(makeJson(false, Json::nullValue, "Status is required", k400BadRequest));
        return;
    }

    std::string newStatus = (*json)["status"].asString();
    std::string notes = json->isMember("notes") ? (*json)["notes"].asString() : "";
    bool ok = appService_.updateStatus(id, userId, newStatus, notes);
    if (!ok) {
        callback(makeJson(false, Json::nullValue, "Update status failed", k400BadRequest));
        return;
    }

    auto updated = appService_.getApplication(id, userId);
    callback(makeJson(true, updated ? updated->toJson() : Json::nullValue));
}

void ApplicationController::bulkUpdateStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("application_ids") || !json->isMember("status")) {
        callback(makeJson(false, Json::nullValue, "application_ids array and status are required", k400BadRequest));
        return;
    }

    std::vector<uint64_t> ids;
    for (const auto& val : (*json)["application_ids"]) {
        ids.push_back(val.asUInt64());
    }

    size_t count = appService_.bulkUpdateStatus(userId, ids, (*json)["status"].asString());
    Json::Value data;
    data["updated"] = static_cast<Json::UInt64>(count);
    callback(makeJson(true, data));
}

void ApplicationController::duplicateApplication(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto dup = appService_.duplicateApplication(id, userId);
    if (!dup) {
        callback(makeJson(false, Json::nullValue, "Duplicate failed", k404NotFound));
        return;
    }
    callback(makeJson(true, dup->toJson(), "", k201Created));
}

void ApplicationController::getStatusHistory(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto hist = appService_.getStatusHistory(id, userId);
    Json::Value arr(Json::arrayValue);
    for (const auto& h : hist) arr.append(h.toJson());
    callback(makeJson(true, arr));
}

// ----------------------------------------------------------------------------
// CompanyController
// ----------------------------------------------------------------------------
void CompanyController::listCompanies(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto list = companyService_.listCompanies(userId);
    Json::Value arr(Json::arrayValue);
    for (const auto& c : list) arr.append(c.toJson());
    callback(makeJson(true, arr));
}

void CompanyController::createCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("name")) {
        callback(makeJson(false, Json::nullValue, "Company name is required", k400BadRequest));
        return;
    }

    Company c;
    c.user_id = userId;
    c.name = (*json)["name"].asString();
    if (json->isMember("website")) c.website = (*json)["website"].asString();
    if (json->isMember("industry")) c.industry = (*json)["industry"].asString();
    if (json->isMember("location")) c.location = (*json)["location"].asString();
    if (json->isMember("recruiter_name")) c.recruiter_name = (*json)["recruiter_name"].asString();
    if (json->isMember("recruiter_email")) c.recruiter_email = (*json)["recruiter_email"].asString();
    if (json->isMember("recruiter_phone")) c.recruiter_phone = (*json)["recruiter_phone"].asString();
    if (json->isMember("notes")) c.notes = (*json)["notes"].asString();

    uint64_t id = companyService_.createCompany(userId, c);
    auto created = companyService_.getCompany(id, userId);
    callback(makeJson(true, created ? created->toJson() : Json::nullValue, "", k201Created));
}

void CompanyController::getCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto c = companyService_.getCompany(id, userId);
    if (!c) {
        callback(makeJson(false, Json::nullValue, "Company not found", k404NotFound));
        return;
    }
    callback(makeJson(true, c->toJson()));
}

void CompanyController::updateCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto c = companyService_.getCompany(id, userId);
    if (!c) {
        callback(makeJson(false, Json::nullValue, "Company not found", k404NotFound));
        return;
    }

    auto json = req->getJsonObject();
    if (json) {
        if (json->isMember("name")) c->name = (*json)["name"].asString();
        if (json->isMember("website")) c->website = (*json)["website"].asString();
        if (json->isMember("industry")) c->industry = (*json)["industry"].asString();
        if (json->isMember("location")) c->location = (*json)["location"].asString();
        if (json->isMember("recruiter_name")) c->recruiter_name = (*json)["recruiter_name"].asString();
        if (json->isMember("recruiter_email")) c->recruiter_email = (*json)["recruiter_email"].asString();
        if (json->isMember("recruiter_phone")) c->recruiter_phone = (*json)["recruiter_phone"].asString();
        if (json->isMember("notes")) c->notes = (*json)["notes"].asString();
        companyService_.updateCompany(userId, *c);
    }
    callback(makeJson(true, c->toJson()));
}

void CompanyController::deleteCompany(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool ok = companyService_.deleteCompany(id, userId);
    callback(makeJson(ok, Json::Value(ok)));
}

// ----------------------------------------------------------------------------
// InterviewController
// ----------------------------------------------------------------------------
void InterviewController::listInterviews(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    std::string from = req->getParameter("from");
    std::string to = req->getParameter("to");
    bool upcoming = (req->getParameter("upcoming") == "true");

    auto list = interviewService_.listInterviews(userId, from, to, upcoming);
    Json::Value arr(Json::arrayValue);
    for (const auto& i : list) arr.append(i.toJson());
    callback(makeJson(true, arr));
}

void InterviewController::createInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("application_id") || !json->isMember("interview_date")) {
        callback(makeJson(false, Json::nullValue, "Application ID and interview date are required", k400BadRequest));
        return;
    }

    Interview it;
    it.user_id = userId;
    it.application_id = (*json)["application_id"].asUInt64();
    it.interview_date = (*json)["interview_date"].asString();
    if (json->isMember("timezone")) it.timezone = (*json)["timezone"].asString();
    if (json->isMember("interview_type")) it.interview_type = (*json)["interview_type"].asString();
    if (json->isMember("interview_round")) it.interview_round = (*json)["interview_round"].asUInt();
    if (json->isMember("meeting_link")) it.meeting_link = (*json)["meeting_link"].asString();
    if (json->isMember("interviewer_details")) it.interviewer_details = (*json)["interviewer_details"].asString();
    if (json->isMember("prep_notes")) it.prep_notes = (*json)["prep_notes"].asString();
    if (json->isMember("result")) it.result = (*json)["result"].asString();

    uint64_t id = interviewService_.createInterview(userId, it);
    auto created = interviewService_.getInterview(id, userId);
    callback(makeJson(true, created ? created->toJson() : Json::nullValue, "", k201Created));
}

void InterviewController::getInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto it = interviewService_.getInterview(id, userId);
    if (!it) {
        callback(makeJson(false, Json::nullValue, "Interview not found", k404NotFound));
        return;
    }
    callback(makeJson(true, it->toJson()));
}

void InterviewController::updateInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto it = interviewService_.getInterview(id, userId);
    if (!it) {
        callback(makeJson(false, Json::nullValue, "Interview not found", k404NotFound));
        return;
    }

    auto json = req->getJsonObject();
    if (json) {
        if (json->isMember("interview_date")) it->interview_date = (*json)["interview_date"].asString();
        if (json->isMember("timezone")) it->timezone = (*json)["timezone"].asString();
        if (json->isMember("interview_type")) it->interview_type = (*json)["interview_type"].asString();
        if (json->isMember("interview_round")) it->interview_round = (*json)["interview_round"].asUInt();
        if (json->isMember("meeting_link")) it->meeting_link = (*json)["meeting_link"].asString();
        if (json->isMember("interviewer_details")) it->interviewer_details = (*json)["interviewer_details"].asString();
        if (json->isMember("prep_notes")) it->prep_notes = (*json)["prep_notes"].asString();
        if (json->isMember("feedback")) it->feedback = (*json)["feedback"].asString();
        if (json->isMember("result")) it->result = (*json)["result"].asString();
        interviewService_.updateInterview(userId, *it);
    }
    callback(makeJson(true, it->toJson()));
}

void InterviewController::deleteInterview(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool ok = interviewService_.deleteInterview(id, userId);
    callback(makeJson(ok, Json::Value(ok)));
}

// ----------------------------------------------------------------------------
// DocumentController
// ----------------------------------------------------------------------------
void DocumentController::listDocuments(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    std::optional<uint64_t> appId;
    if (!req->getParameter("application_id").empty()) {
        try { appId = std::stoull(req->getParameter("application_id")); } catch (...) {}
    }

    auto list = docService_.listDocuments(userId, appId);
    Json::Value arr(Json::arrayValue);
    for (const auto& d : list) arr.append(d.toJson());
    callback(makeJson(true, arr));
}

void DocumentController::uploadDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    MultiPartParser parser;
    if (parser.parse(req) != 0 || parser.getFiles().empty()) {
        callback(makeJson(false, Json::nullValue, "Valid multipart file upload required", k400BadRequest));
        return;
    }

    const auto& file = parser.getFiles()[0];
    std::string originalName = file.getFileName();
    std::string bytes(file.fileData(), file.fileLength());
    std::string docType = "RESUME";
    std::optional<uint64_t> appId;

    for (const auto& [key, val] : parser.getParameters()) {
        if (key == "document_type") docType = val;
        if (key == "application_id") {
            try { appId = std::stoull(val); } catch (...) {}
        }
    }

    try {
        uint64_t id = docService_.saveDocument(userId, appId, originalName, "application/octet-stream", bytes);
        auto doc = docService_.getDocument(id, userId);
        callback(makeJson(true, doc ? doc->toJson() : Json::nullValue, "", k201Created));
    } catch (const std::exception& e) {
        callback(makeJson(false, Json::nullValue, e.what(), k400BadRequest));
    }
}

void DocumentController::downloadDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto doc = docService_.getDocument(id, userId);
    if (!doc || !std::filesystem::exists(doc->file_path)) {
        callback(makeJson(false, Json::nullValue, "Document not found", k404NotFound));
        return;
    }

    auto resp = HttpResponse::newFileResponse(doc->file_path, doc->document_name);
    callback(resp);
}

void DocumentController::deleteDocument(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool ok = docService_.deleteDocument(id, userId);
    callback(makeJson(ok, Json::Value(ok)));
}

// ----------------------------------------------------------------------------
// AnalyticsController
// ----------------------------------------------------------------------------
void AnalyticsController::getDashboard(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    Json::Value metrics = analyticsService_.getDashboardMetrics(userId);
    callback(makeJson(true, metrics));
}

void AnalyticsController::getAnalytics(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    Json::Value metrics = analyticsService_.getAnalyticsMetrics(userId);
    callback(makeJson(true, metrics));
}

void AnalyticsController::exportData(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    Json::Value dump = analyticsService_.exportUserData(userId);
    auto resp = HttpResponse::newHttpJsonResponse(dump);
    resp->addHeader("Content-Disposition", "attachment; filename=\"jobpilot_export.json\"");
    callback(resp);
}

// ----------------------------------------------------------------------------
// ReminderController
// ----------------------------------------------------------------------------
void ReminderController::listReminders(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool inc = (req->getParameter("include_completed") == "true");
    auto list = reminderRepo_.listReminders(userId, inc);
    Json::Value arr(Json::arrayValue);
    for (const auto& r : list) arr.append(r.toJson());
    callback(makeJson(true, arr));
}

void ReminderController::createReminder(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("title") || !json->isMember("due_date")) {
        callback(makeJson(false, Json::nullValue, "Title and due date are required", k400BadRequest));
        return;
    }

    Reminder rem;
    rem.user_id = userId;
    rem.title = (*json)["title"].asString();
    rem.due_date = (*json)["due_date"].asString();
    if (json->isMember("description")) rem.description = (*json)["description"].asString();
    if (json->isMember("reminder_type")) rem.reminder_type = (*json)["reminder_type"].asString();
    if (json->isMember("application_id") && !(*json)["application_id"].isNull()) {
        rem.application_id = (*json)["application_id"].asUInt64();
    }
    if (json->isMember("interview_id") && !(*json)["interview_id"].isNull()) {
        rem.interview_id = (*json)["interview_id"].asUInt64();
    }

    uint64_t id = reminderRepo_.createReminder(rem);
    rem.id = id;
    callback(makeJson(true, rem.toJson(), "", k201Created));
}

void ReminderController::toggleComplete(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    bool completed = json && json->isMember("is_completed") ? (*json)["is_completed"].asBool() : true;
    bool ok = reminderRepo_.toggleComplete(id, userId, completed);
    callback(makeJson(ok, Json::Value(ok)));
}

void ReminderController::deleteReminder(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, uint64_t id) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    bool ok = reminderRepo_.deleteReminder(id, userId);
    callback(makeJson(ok, Json::Value(ok)));
}

// ----------------------------------------------------------------------------
// UserController
// ----------------------------------------------------------------------------
void UserController::updateProfile(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (!json || !json->isMember("full_name")) {
        callback(makeJson(false, Json::nullValue, "Full name is required", k400BadRequest));
        return;
    }

    userRepo_.updateProfile(userId, (*json)["full_name"].asString());
    auto u = userRepo_.findById(userId);
    callback(makeJson(true, u ? u->toJson() : Json::nullValue));
}

void UserController::updatePreferences(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (json) {
        UserPreferences p = userRepo_.getPreferences(userId);
        if (json->isMember("theme")) p.theme = (*json)["theme"].asString();
        if (json->isMember("default_currency")) p.default_currency = (*json)["default_currency"].asString();
        if (json->isMember("timezone")) p.timezone = (*json)["timezone"].asString();
        if (json->isMember("email_notifications")) p.email_notifications = (*json)["email_notifications"].asBool();
        userRepo_.updatePreferences(userId, p);
        callback(makeJson(true, p.toJson()));
        return;
    }
    callback(makeJson(false, Json::nullValue, "Invalid preferences payload", k400BadRequest));
}

void UserController::updateNotificationPreferences(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    uint64_t userId = req->attributes()->get<uint64_t>("user_id");
    auto json = req->getJsonObject();
    if (json) {
        NotificationPreferences p = userRepo_.getNotificationPreferences(userId);
        if (json->isMember("email_interview_reminders")) p.email_interview_reminders = (*json)["email_interview_reminders"].asBool();
        if (json->isMember("email_deadline_reminders")) p.email_deadline_reminders = (*json)["email_deadline_reminders"].asBool();
        if (json->isMember("email_followup_reminders")) p.email_followup_reminders = (*json)["email_followup_reminders"].asBool();
        if (json->isMember("email_daily_digest")) p.email_daily_digest = (*json)["email_daily_digest"].asBool();
        if (json->isMember("lead_time_hours")) p.lead_time_hours = (*json)["lead_time_hours"].asUInt();
        userRepo_.updateNotificationPreferences(userId, p);
        callback(makeJson(true, p.toJson()));
        return;
    }
    callback(makeJson(false, Json::nullValue, "Invalid notification preferences payload", k400BadRequest));
}

} // namespace jobpilot::controllers
