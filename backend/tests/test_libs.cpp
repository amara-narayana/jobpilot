#include <iostream>
#include <string>
#include <chrono>
#include <mysql/mysql.h>
#include <argon2.h>
#include <json/json.h>
#include <openssl/sha.h>
#include <openssl/rand.h>

int main() {
    std::cout << "MySQL Client Version: " << mysql_get_client_info() << std::endl;
    std::cout << "Argon2 Version: " << ARGON2_VERSION_NUMBER << std::endl;
    
    Json::Value root;
    root["app"] = "JobPilot";
    root["status"] = "OK";
    Json::FastWriter writer;
    std::cout << "JSON: " << writer.write(root);

    unsigned char buf[16];
    if (RAND_bytes(buf, sizeof(buf)) == 1) {
        std::cout << "OpenSSL RAND: Success" << std::endl;
    }
    return 0;
}
