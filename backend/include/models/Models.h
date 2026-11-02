#pragma once

#include <string>
#include <optional>
#include <vector>
#include <json/json.h>

namespace jobpilot::models {

struct User {
    uint64_t id = 0;
    std::string full_name;
    std::string email;
    std::string password_hash;
    bool is_verified = false;
    std::string created_at;
    std::string updated_at;

    Json::Value toJson(bool includePrivate = false) const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["full_name"] = full_name;
        j["email"] = email;
        j["is_verified"] = is_verified;
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        if (includePrivate) {
            j["password_hash"] = password_hash;
        }
        return j;
    }
};

struct UserPreferences {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::string theme = "dark";
    std::string default_currency = "USD";
    std::string timezone = "UTC";
    bool email_notifications = true;

    Json::Value toJson() const {
        Json::Value j;
        j["theme"] = theme;
        j["default_currency"] = default_currency;
        j["timezone"] = timezone;
        j["email_notifications"] = email_notifications;
        return j;
    }
};

struct NotificationPreferences {
    uint64_t id = 0;
    uint64_t user_id = 0;
    bool email_interview_reminders = true;
    bool email_deadline_reminders = true;
    bool email_followup_reminders = true;
    bool email_daily_digest = false;
    uint32_t lead_time_hours = 24;

    Json::Value toJson() const {
        Json::Value j;
        j["email_interview_reminders"] = email_interview_reminders;
        j["email_deadline_reminders"] = email_deadline_reminders;
        j["email_followup_reminders"] = email_followup_reminders;
        j["email_daily_digest"] = email_daily_digest;
        j["lead_time_hours"] = lead_time_hours;
        return j;
    }
};

struct Company {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::string name;
    std::string website;
    std::string industry;
    std::string location;
    std::string recruiter_name;
    std::string recruiter_email;
    std::string recruiter_phone;
    std::string notes;
    std::string created_at;
    std::string updated_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        j["name"] = name;
        j["website"] = website.empty() ? Json::nullValue : Json::Value(website);
        j["industry"] = industry.empty() ? Json::nullValue : Json::Value(industry);
        j["location"] = location.empty() ? Json::nullValue : Json::Value(location);
        j["recruiter_name"] = recruiter_name.empty() ? Json::nullValue : Json::Value(recruiter_name);
        j["recruiter_email"] = recruiter_email.empty() ? Json::nullValue : Json::Value(recruiter_email);
        j["recruiter_phone"] = recruiter_phone.empty() ? Json::nullValue : Json::Value(recruiter_phone);
        j["notes"] = notes.empty() ? Json::nullValue : Json::Value(notes);
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        return j;
    }
};

struct Application {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::optional<uint64_t> company_id;
    std::string company_name;
    std::string job_title;
    std::string job_description;
    std::string job_url;
    std::string location;
    std::string employment_type = "FULL_TIME";
    std::optional<double> salary_min;
    std::optional<double> salary_max;
    std::string currency = "USD";
    std::string date_discovered;
    std::string date_applied;
    std::string deadline;
    std::string resume_version;
    std::string cover_letter;
    std::string notes;
    std::string status = "SAVED";
    std::string created_at;
    std::string updated_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        if (company_id) j["company_id"] = static_cast<Json::UInt64>(*company_id);
        else j["company_id"] = Json::nullValue;
        j["company_name"] = company_name;
        j["job_title"] = job_title;
        j["job_description"] = job_description.empty() ? Json::nullValue : Json::Value(job_description);
        j["job_url"] = job_url.empty() ? Json::nullValue : Json::Value(job_url);
        j["location"] = location.empty() ? Json::nullValue : Json::Value(location);
        j["employment_type"] = employment_type;
        if (salary_min) j["salary_min"] = *salary_min; else j["salary_min"] = Json::nullValue;
        if (salary_max) j["salary_max"] = *salary_max; else j["salary_max"] = Json::nullValue;
        j["currency"] = currency;
        j["date_discovered"] = date_discovered.empty() ? Json::nullValue : Json::Value(date_discovered);
        j["date_applied"] = date_applied.empty() ? Json::nullValue : Json::Value(date_applied);
        j["deadline"] = deadline.empty() ? Json::nullValue : Json::Value(deadline);
        j["resume_version"] = resume_version.empty() ? Json::nullValue : Json::Value(resume_version);
        j["cover_letter"] = cover_letter.empty() ? Json::nullValue : Json::Value(cover_letter);
        j["notes"] = notes.empty() ? Json::nullValue : Json::Value(notes);
        j["status"] = status;
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        return j;
    }
};

struct ApplicationStatusHistory {
    uint64_t id = 0;
    uint64_t application_id = 0;
    std::string from_status;
    std::string to_status;
    std::string notes;
    std::string changed_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["application_id"] = static_cast<Json::UInt64>(application_id);
        j["from_status"] = from_status.empty() ? Json::nullValue : Json::Value(from_status);
        j["to_status"] = to_status;
        j["notes"] = notes.empty() ? Json::nullValue : Json::Value(notes);
        j["changed_at"] = changed_at;
        return j;
    }
};

struct Interview {
    uint64_t id = 0;
    uint64_t user_id = 0;
    uint64_t application_id = 0;
    std::string company_name;
    std::string job_title;
    std::string interview_date;
    std::string timezone = "UTC";
    std::string interview_type = "SCREENING";
    uint32_t interview_round = 1;
    std::string meeting_link;
    std::string interviewer_details;
    std::string prep_notes;
    std::string feedback;
    std::string result = "PENDING";
    std::string created_at;
    std::string updated_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        j["application_id"] = static_cast<Json::UInt64>(application_id);
        if (!company_name.empty()) j["company_name"] = company_name;
        if (!job_title.empty()) j["job_title"] = job_title;
        j["interview_date"] = interview_date;
        j["timezone"] = timezone;
        j["interview_type"] = interview_type;
        j["interview_round"] = interview_round;
        j["meeting_link"] = meeting_link.empty() ? Json::nullValue : Json::Value(meeting_link);
        j["interviewer_details"] = interviewer_details.empty() ? Json::nullValue : Json::Value(interviewer_details);
        j["prep_notes"] = prep_notes.empty() ? Json::nullValue : Json::Value(prep_notes);
        j["feedback"] = feedback.empty() ? Json::nullValue : Json::Value(feedback);
        j["result"] = result;
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        return j;
    }
};

struct DocumentItem {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::optional<uint64_t> application_id;
    std::string document_name;
    std::string document_type = "RESUME";
    std::string file_path;
    uint64_t file_size_bytes = 0;
    std::string mime_type;
    std::string created_at;
    std::string updated_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        if (application_id) j["application_id"] = static_cast<Json::UInt64>(*application_id);
        else j["application_id"] = Json::nullValue;
        j["document_name"] = document_name;
        j["document_type"] = document_type;
        j["file_path"] = file_path;
        j["file_size_bytes"] = static_cast<Json::UInt64>(file_size_bytes);
        j["mime_type"] = mime_type;
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        return j;
    }
};

struct Reminder {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::optional<uint64_t> application_id;
    std::optional<uint64_t> interview_id;
    std::string company_name;
    std::string job_title;
    std::string title;
    std::string description;
    std::string reminder_type = "DEADLINE";
    std::string due_date;
    bool is_completed = false;
    bool is_sent = false;
    std::string sent_at;
    std::string created_at;
    std::string updated_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        if (application_id) j["application_id"] = static_cast<Json::UInt64>(*application_id);
        else j["application_id"] = Json::nullValue;
        if (interview_id) j["interview_id"] = static_cast<Json::UInt64>(*interview_id);
        else j["interview_id"] = Json::nullValue;
        if (!company_name.empty()) j["company_name"] = company_name;
        if (!job_title.empty()) j["job_title"] = job_title;
        j["title"] = title;
        j["description"] = description.empty() ? Json::nullValue : Json::Value(description);
        j["reminder_type"] = reminder_type;
        j["due_date"] = due_date;
        j["is_completed"] = is_completed;
        j["is_sent"] = is_sent;
        j["created_at"] = created_at;
        j["updated_at"] = updated_at;
        return j;
    }
};

struct ActivityLog {
    uint64_t id = 0;
    uint64_t user_id = 0;
    std::string action;
    std::string entity_type;
    std::optional<uint64_t> entity_id;
    std::string details;
    std::string created_at;

    Json::Value toJson() const {
        Json::Value j;
        j["id"] = static_cast<Json::UInt64>(id);
        j["user_id"] = static_cast<Json::UInt64>(user_id);
        j["action"] = action;
        j["entity_type"] = entity_type;
        if (entity_id) j["entity_id"] = static_cast<Json::UInt64>(*entity_id);
        else j["entity_id"] = Json::nullValue;
        j["created_at"] = created_at;
        return j;
    }
};

} // namespace jobpilot::models
