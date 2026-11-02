#pragma once

#include <mysql/mysql.h>
#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <unordered_map>
#include <json/json.h>

namespace jobpilot::db {

struct DbConfig {
    std::string host = "127.0.0.1";
    unsigned int port = 3306;
    std::string user = "root";
    std::string password = "";
    std::string database = "jobpilot";
    size_t poolSize = 10;
};

class DbPool;

class DbConnection {
public:
    DbConnection(MYSQL* conn, DbPool* pool);
    ~DbConnection();

    // Non-copyable, movable
    DbConnection(const DbConnection&) = delete;
    DbConnection& operator=(const DbConnection&) = delete;
    DbConnection(DbConnection&& other) noexcept;
    DbConnection& operator=(DbConnection&& other) noexcept;

    MYSQL* raw() const { return conn_; }

    // Execute queries and return results
    Json::Value queryJson(const std::string& sql);
    int64_t execute(const std::string& sql);
    uint64_t lastInsertId() const;
    std::string escape(const std::string& str);

    // Transaction controls
    void beginTransaction();
    void commit();
    void rollback();

private:
    MYSQL* conn_ = nullptr;
    DbPool* pool_ = nullptr;
    bool inTransaction_ = false;
};

class TransactionGuard {
public:
    explicit TransactionGuard(DbConnection& conn);
    ~TransactionGuard();
    void commit();

private:
    DbConnection& conn_;
    bool committed_ = false;
};

class DbPool {
public:
    static DbPool& getInstance();

    void init(const DbConfig& config);
    DbConnection getConnection();
    void returnConnection(MYSQL* conn);
    void close();

    const DbConfig& getConfig() const { return config_; }

private:
    DbPool() = default;
    ~DbPool();

    MYSQL* createConnection();
    void destroyConnection(MYSQL* conn);

    DbConfig config_;
    std::queue<MYSQL*> pool_;
    std::mutex mutex_;
    std::condition_variable cv_;
    bool initialized_ = false;
    bool stopping_ = false;
};

} // namespace jobpilot::db
