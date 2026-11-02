#pragma once

#include <string>
#include <vector>

namespace jobpilot::utils {

class CryptoUtils {
public:
    // Hashes password using standard Argon2id algorithm
    static std::string hashPassword(const std::string& password);

    // Verifies password against Argon2id hash
    static bool verifyPassword(const std::string& password, const std::string& hash);

    // Generates a cryptographically secure random hex token (default 32 bytes = 64 hex characters)
    static std::string generateToken(size_t numBytes = 32);

    // Computes SHA-256 hash of input string and returns hex representation
    static std::string sha256(const std::string& input);

    // Generates a cryptographically secure 6-digit numeric OTP code
    static std::string generateOtp();
};

} // namespace jobpilot::utils
