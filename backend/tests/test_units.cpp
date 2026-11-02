#include <iostream>
#include <cassert>
#include <string>
#include "utils/CryptoUtils.h"

using namespace jobpilot::utils;

void testArgon2id() {
    std::cout << "[TEST] Running Argon2id password hashing test..." << std::endl;
    std::string pwd = "SecureMasterPassword2026!";
    std::string hash = CryptoUtils::hashPassword(pwd);

    assert(!hash.empty());
    assert(hash.find("$argon2id$") != std::string::npos);
    assert(CryptoUtils::verifyPassword(pwd, hash) == true);
    assert(CryptoUtils::verifyPassword("WrongPassword!", hash) == false);
    std::cout << "  -> Argon2id hashing and verification PASSED" << std::endl;
}

void testTokensAndOtp() {
    std::cout << "[TEST] Running token and OTP cryptographic tests..." << std::endl;
    std::string token1 = CryptoUtils::generateToken(32);
    std::string token2 = CryptoUtils::generateToken(32);

    assert(token1.length() == 64);
    assert(token2.length() == 64);
    assert(token1 != token2);

    std::string otp = CryptoUtils::generateOtp();
    assert(otp.length() == 6);
    for (char c : otp) {
        assert(std::isdigit(static_cast<unsigned char>(c)));
    }

    std::string hash1 = CryptoUtils::sha256("test_string");
    std::string hash2 = CryptoUtils::sha256("test_string");
    assert(hash1 == hash2);
    assert(hash1.length() == 64);
    std::cout << "  -> Tokens, OTP and SHA-256 tests PASSED" << std::endl;
}

int main() {
    std::cout << "===========================================" << std::endl;
    std::cout << "  JobPilot Backend Unit Test Suite         " << std::endl;
    std::cout << "===========================================" << std::endl;

    try {
        testArgon2id();
        testTokensAndOtp();
        std::cout << "===========================================" << std::endl;
        std::cout << "  ALL UNIT TESTS PASSED SUCCESSFULLY!      " << std::endl;
        std::cout << "===========================================" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Test failed with exception: " << e.what() << std::endl;
        return 1;
    }
}
