#pragma once

#include <drogon/HttpFilter.h>
#include "services/Services.h"

namespace jobpilot::middleware {

class AuthFilter : public drogon::HttpFilter<AuthFilter> {
public:
    AuthFilter();
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& fcb,
                  drogon::FilterChainCallback&& fccb) override;

private:
    services::AuthService authService_;
};

class CorsFilter : public drogon::HttpFilter<CorsFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& fcb,
                  drogon::FilterChainCallback&& fccb) override;
};

} // namespace jobpilot::middleware
