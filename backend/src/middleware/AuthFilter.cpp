#include "middleware/AuthFilter.h"
#include <drogon/HttpResponse.h>

namespace jobpilot::middleware {

AuthFilter::AuthFilter() {}

void AuthFilter::doFilter(const drogon::HttpRequestPtr& req,
                          drogon::FilterCallback&& fcb,
                          drogon::FilterChainCallback&& fccb) {
    // 1. Look for cookie
    std::string token = req->getCookie("jobpilot_session");

    // 2. If cookie empty, look for Authorization: Bearer <token>
    if (token.empty()) {
        std::string authHeader = req->getHeader("Authorization");
        if (authHeader.rfind("Bearer ", 0) == 0) {
            token = authHeader.substr(7);
        }
    }

    // Local Single-User Mode:
    // If no session token or expired session, automatically authenticate as local user (ID 1)
    if (token.empty()) {
        uint64_t defaultLocalUserId = 1;
        req->attributes()->insert("user_id", defaultLocalUserId);
        fccb();
        return;
    }

    auto userId = authService_.validateSession(token);
    if (!userId) {
        uint64_t defaultLocalUserId = 1;
        req->attributes()->insert("user_id", defaultLocalUserId);
        fccb();
        return;
    }

    // Attach user_id to request attributes
    req->attributes()->insert("user_id", *userId);
    fccb();
}

void CorsFilter::doFilter(const drogon::HttpRequestPtr& req,
                          drogon::FilterCallback&& fcb,
                          drogon::FilterChainCallback&& fccb) {
    if (req->method() == drogon::Options) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k200OK);
        resp->addHeader("Access-Control-Allow-Origin", req->getHeader("Origin").empty() ? "*" : req->getHeader("Origin"));
        resp->addHeader("Access-Control-Allow-Credentials", "true");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        resp->addHeader("Access-Control-Max-Age", "86400");
        fcb(resp);
        return;
    }
    fccb();
}

} // namespace jobpilot::middleware
