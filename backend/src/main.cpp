#include <drogon/drogon.h>
#include "utils/DbPool.h"
#include "services/Services.h"
#include <iostream>
#include <cstdlib>
#include <filesystem>
#include <csignal>

using namespace drogon;
using namespace jobpilot;

void signalHandler(int signum) {
    std::cout << "\n[JobPilot] Received signal " << signum << ". Shutting down cleanly..." << std::endl;
    services::ReminderWorker::getInstance().stop();
    db::DbPool::getInstance().close();
    app().quit();
}

int main(int argc, char* argv[]) {
    std::cout << "==========================================================" << std::endl;
    std::cout << "  JOBPILOT - Career Operating System Backend (C++20 Drogon)" << std::endl;
    std::cout << "==========================================================" << std::endl;

    // 1. Ensure uploads directory exists
    std::filesystem::create_directories("uploads");

    // 2. Read database configuration from environment
    db::DbConfig dbConfig;
    if (const char* h = std::getenv("MYSQL_HOST")) dbConfig.host = h;
    if (const char* p = std::getenv("MYSQL_PORT")) dbConfig.port = std::stoi(p);
    if (const char* u = std::getenv("MYSQL_USER")) dbConfig.user = u;
    if (const char* pwd = std::getenv("MYSQL_PASSWORD")) dbConfig.password = pwd;
    if (const char* d = std::getenv("MYSQL_DATABASE")) dbConfig.database = d;
    if (const char* pool = std::getenv("MYSQL_POOL_SIZE")) dbConfig.poolSize = std::stoul(pool);

    std::cout << "[JobPilot] Connecting to MySQL at " << dbConfig.host << ":" << dbConfig.port
              << " Database: " << dbConfig.database << " User: " << dbConfig.user << std::endl;

    try {
        db::DbPool::getInstance().init(dbConfig);
        std::cout << "[JobPilot] MySQL Connection Pool successfully initialized ("
                  << dbConfig.poolSize << " connections)." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "[JobPilot] Warning: Could not initialize database pool: " << e.what() << std::endl;
        std::cerr << "[JobPilot] Backend starting in offline/standby mode." << std::endl;
    }

    // 3. Start Background Reminder Engine
    services::ReminderWorker::getInstance().start();
    std::cout << "[JobPilot] Background Reminder Worker running." << std::endl;

    // 4. Configure Drogon HTTP Engine
    int port = 8080;
    if (const char* p = std::getenv("PORT")) port = std::stoi(p);

    app().addListener("0.0.0.0", port);
    app().setThreadNum(std::thread::hardware_concurrency() > 0 ? std::thread::hardware_concurrency() : 4);
    app().setUploadPath("uploads");
    app().setClientMaxBodySize(20 * 1024 * 1024); // 20 MB max file upload
    app().enableGzip(true);

    // Register OS signal handlers for graceful shutdown
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);

    std::cout << "[JobPilot] HTTP REST API listening on http://127.0.0.1:" << port << "/api/v1/" << std::endl;

    // 5. Start event loop
    app().run();

    services::ReminderWorker::getInstance().stop();
    db::DbPool::getInstance().close();
    std::cout << "[JobPilot] Server shutdown complete." << std::endl;
    return 0;
}
