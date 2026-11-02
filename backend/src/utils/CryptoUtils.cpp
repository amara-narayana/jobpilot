#include "utils/CryptoUtils.h"
#include <argon2.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <random>

namespace jobpilot::utils {

// Argon2id parameters
constexpr uint32_t T_COST = 3;         // 3 iterations
constexpr uint32_t M_COST = 65536;     // 64 MiB memory
constexpr uint32_t PARALLELISM = 4;    // 4 threads
constexpr size_t HASH_LEN = 32;        // 32-byte hash
constexpr size_t SALT_LEN = 16;        // 16-byte random salt

std::string CryptoUtils::hashPassword(const std::string& password) {
    uint8_t salt[SALT_LEN];
    if (RAND_bytes(salt, sizeof(salt)) != 1) {
        throw std::runtime_error("Failed to generate secure random salt");
    }

    size_t encodedLen = argon2_encodedlen(T_COST, M_COST, PARALLELISM, SALT_LEN, HASH_LEN, Argon2_id);
    std::vector<char> encoded(encodedLen);

    int result = argon2id_hash_encoded(
        T_COST,
        M_COST,
        PARALLELISM,
        password.data(),
        password.size(),
        salt,
        sizeof(salt),
        HASH_LEN,
        encoded.data(),
        encodedLen
    );

    if (result != ARGON2_OK) {
        throw std::runtime_error(std::string("Argon2id hashing error: ") + argon2_error_message(result));
    }

    return std::string(encoded.data());
}

bool CryptoUtils::verifyPassword(const std::string& password, const std::string& hash) {
    int result = argon2id_verify(hash.c_str(), password.data(), password.size());
    return (result == ARGON2_OK);
}

std::string CryptoUtils::generateToken(size_t numBytes) {
    std::vector<uint8_t> buffer(numBytes);
    if (RAND_bytes(buffer.data(), static_cast<int>(numBytes)) != 1) {
        throw std::runtime_error("Failed to generate random bytes for token");
    }

    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (uint8_t byte : buffer) {
        oss << std::setw(2) << static_cast<int>(byte);
    }
    return oss.str();
}

std::string CryptoUtils::sha256(const std::string& input) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(input.data()), input.size(), hash);

    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        oss << std::setw(2) << static_cast<int>(hash[i]);
    }
    return oss.str();
}

std::string CryptoUtils::generateOtp() {
    uint32_t randVal = 0;
    if (RAND_bytes(reinterpret_cast<unsigned char*>(&randVal), sizeof(randVal)) != 1) {
        // Fallback to std::random_device if OpenSSL fails
        std::random_device rd;
        randVal = rd();
    }
    uint32_t otpNum = randVal % 1000000;
    std::ostringstream oss;
    oss << std::setw(6) << std::setfill('0') << otpNum;
    return oss.str();
}

} // namespace jobpilot::utils
