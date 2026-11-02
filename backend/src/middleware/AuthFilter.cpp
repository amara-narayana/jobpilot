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

    if (token.empty()) {
        Json::Value err;
        err["success"] = false;
        err["error"] = "Authentication required";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(drogon::k401Unauthorized);
        fcb(resp);
        return;
    }

    auto userId = authService_.validateSession(token);
    if (!userId) {
        Json::Value err;
        err["success"] = false;
        err["error"] = "Invalid or expired session";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(drogon::k401Unauthorized);
        fcb(resp);
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
