#include "utils/DbPool.h"
#include <iostream>
#include <stdexcept>
#include <chrono>

namespace jobpilot::db {

// ----------------------------------------------------------------------------
// DbConnection Implementation
// ----------------------------------------------------------------------------
DbConnection::DbConnection(MYSQL* conn, DbPool* pool)
    : conn_(conn), pool_(pool) {}

DbConnection::~DbConnection() {
    if (conn_ && pool_) {
        if (inTransaction_) {
            try { rollback(); } catch (...) {}
        }
        pool_->returnConnection(conn_);
    }
}

DbConnection::DbConnection(DbConnection&& other) noexcept
    : conn_(other.conn_), pool_(other.pool_), inTransaction_(other.inTransaction_) {
    other.conn_ = nullptr;
    other.pool_ = nullptr;
    other.inTransaction_ = false;
}

DbConnection& DbConnection::operator=(DbConnection&& other) noexcept {
    if (this != &other) {
        if (conn_ && pool_) {
            pool_->returnConnection(conn_);
        }
        conn_ = other.conn_;
        pool_ = other.pool_;
        inTransaction_ = other.inTransaction_;
        other.conn_ = nullptr;
        other.pool_ = nullptr;
        other.inTransaction_ = false;
    }
    return *this;
}

Json::Value DbConnection::queryJson(const std::string& sql) {
    if (!conn_) throw std::runtime_error("DbConnection: connection is null");

    if (mysql_query(conn_, sql.c_str()) != 0) {
        throw std::runtime_error(std::string("MySQL Query Error: ") + mysql_error(conn_) + " SQL: " + sql);
    }

    MYSQL_RES* res = mysql_store_result(conn_);
    if (!res) {
        // Query had no result set (e.g. INSERT / UPDATE)
        return Json::arrayValue;
    }

    int numFields = mysql_num_fields(res);
    MYSQL_FIELD* fields = mysql_fetch_fields(res);

    Json::Value rows(Json::arrayValue);
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(res))) {
        unsigned long* lengths = mysql_fetch_lengths(res);
        Json::Value item(Json::objectValue);
        for (int i = 0; i < numFields; ++i) {
            std::string fieldName = fields[i].name;
            if (row[i] == nullptr) {
                item[fieldName] = Json::nullValue;
            } else {
                std::string val(row[i], lengths[i]);
                // Automatically convert numeric types to json numbers
                if (fields[i].type == MYSQL_TYPE_TINY ||
                    fields[i].type == MYSQL_TYPE_SHORT ||
                    fields[i].type == MYSQL_TYPE_LONG ||
                    fields[i].type == MYSQL_TYPE_LONGLONG ||
                    fields[i].type == MYSQL_TYPE_INT24) {
                    try {
                        item[fieldName] = static_cast<Json::Int64>(std::stoll(val));
                    } catch (...) {
                        item[fieldName] = val;
                    }
                } else if (fields[i].type == MYSQL_TYPE_FLOAT ||
                           fields[i].type == MYSQL_TYPE_DOUBLE ||
                           fields[i].type == MYSQL_TYPE_DECIMAL ||
                           fields[i].type == MYSQL_TYPE_NEWDECIMAL) {
                    try {
                        item[fieldName] = std::stod(val);
                    } catch (...) {
                        item[fieldName] = val;
                    }
                } else {
                    item[fieldName] = val;
                }
            }
        }
        rows.append(item);
    }

    mysql_free_result(res);
    return rows;
}

int64_t DbConnection::execute(const std::string& sql) {
    if (!conn_) throw std::runtime_error("DbConnection: connection is null");

    if (mysql_query(conn_, sql.c_str()) != 0) {
        throw std::runtime_error(std::string("MySQL Execute Error: ") + mysql_error(conn_) + " SQL: " + sql);
    }

    return static_cast<int64_t>(mysql_affected_rows(conn_));
}

uint64_t DbConnection::lastInsertId() const {
    if (!conn_) return 0;
    return mysql_insert_id(conn_);
}

std::string DbConnection::escape(const std::string& str) {
    if (!conn_) return str;
    std::vector<char> escaped(str.size() * 2 + 1);
    unsigned long len = mysql_real_escape_string(conn_, escaped.data(), str.data(), str.size());
    return std::string(escaped.data(), len);
}

void DbConnection::beginTransaction() {
    execute("START TRANSACTION;");
    inTransaction_ = true;
}

void DbConnection::commit() {
    execute("COMMIT;");
    inTransaction_ = false;
}

void DbConnection::rollback() {
    execute("ROLLBACK;");
    inTransaction_ = false;
}

// ----------------------------------------------------------------------------
// TransactionGuard Implementation
// ----------------------------------------------------------------------------
TransactionGuard::TransactionGuard(DbConnection& conn) : conn_(conn) {
    conn_.beginTransaction();
}

TransactionGuard::~TransactionGuard() {
    if (!committed_) {
        try { conn_.rollback(); } catch (...) {}
    }
}

void TransactionGuard::commit() {
    if (!committed_) {
        conn_.commit();
        committed_ = true;
    }
}

// ----------------------------------------------------------------------------
// DbPool Implementation
// ----------------------------------------------------------------------------
DbPool& DbPool::getInstance() {
    static DbPool instance;
    return instance;
}

DbPool::~DbPool() {
    close();
}

void DbPool::init(const DbConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (initialized_) return;

    config_ = config;
    for (size_t i = 0; i < config_.poolSize; ++i) {
        MYSQL* conn = createConnection();
        if (conn) {
            pool_.push(conn);
        }
    }

    initialized_ = true;
    stopping_ = false;
}

MYSQL* DbPool::createConnection() {
    MYSQL* conn = mysql_init(nullptr);
    if (!conn) {
        std::cerr << "[DbPool] mysql_init failed" << std::endl;
        return nullptr;
    }

    // Set connection timeout (5 seconds)
    unsigned int timeout = 5;
    mysql_options(conn, MYSQL_OPT_CONNECT_TIMEOUT, &timeout);

    // Auto reconnect
    my_bool reconnect = 1;
    mysql_options(conn, MYSQL_OPT_RECONNECT, &reconnect);

    if (!mysql_real_connect(conn,
                            config_.host.c_str(),
                            config_.user.c_str(),
                            config_.password.c_str(),
                            config_.database.c_str(),
                            config_.port,
                            nullptr,
                            CLIENT_MULTI_STATEMENTS)) {
        std::cerr << "[DbPool] Connection error: " << mysql_error(conn) << std::endl;
        mysql_close(conn);
        return nullptr;
    }

    // Force UTF-8 encoding
    mysql_set_character_set(conn, "utf8mb4");
    return conn;
}

void DbPool::destroyConnection(MYSQL* conn) {
    if (conn) {
        mysql_close(conn);
    }
}

DbConnection DbPool::getConnection() {
    std::unique_lock<std::mutex> lock(mutex_);

    // If pool has an available connection, reuse it
    if (!pool_.empty()) {
        MYSQL* conn = pool_.front();
        pool_.pop();

        // Health check connection
        if (mysql_ping(conn) != 0) {
            destroyConnection(conn);
            conn = createConnection();
            if (!conn) {
                throw std::runtime_error("Failed to restore dead MySQL connection");
            }
        }
        return DbConnection(conn, this);
    }

    // If pool is empty, attempt to create a connection immediately
    if (!stopping_) {
        MYSQL* directConn = createConnection();
        if (directConn) {
            return DbConnection(directConn, this);
        }
    }

    // Wait up to 5 seconds for a connection to return to pool
    bool acquired = cv_.wait_for(lock, std::chrono::seconds(5), [this]() {
        return !pool_.empty() || stopping_;
    });

    if (stopping_) {
        throw std::runtime_error("DbPool is stopping");
    }

    if (!acquired || pool_.empty()) {
        // Last attempt to create on demand
        MYSQL* directConn = createConnection();
        if (directConn) {
            return DbConnection(directConn, this);
        }
        throw std::runtime_error("Database connection timeout: Unable to acquire a connection from MySQL pool. Please verify MySQL service is running and credentials in .env are correct.");
    }

    MYSQL* conn = pool_.front();
    pool_.pop();

    if (mysql_ping(conn) != 0) {
        destroyConnection(conn);
        conn = createConnection();
        if (!conn) {
            throw std::runtime_error("Failed to restore dead MySQL connection");
        }
    }

    return DbConnection(conn, this);
}

void DbPool::returnConnection(MYSQL* conn) {
    if (!conn) return;

    std::lock_guard<std::mutex> lock(mutex_);
    if (stopping_) {
        destroyConnection(conn);
    } else {
        pool_.push(conn);
        cv_.notify_one();
    }
}

void DbPool::close() {
    std::lock_guard<std::mutex> lock(mutex_);
    stopping_ = true;
    cv_.notify_all();

    while (!pool_.empty()) {
        MYSQL* conn = pool_.front();
        pool_.pop();
        destroyConnection(conn);
    }
    initialized_ = false;
}

} // namespace jobpilot::db
