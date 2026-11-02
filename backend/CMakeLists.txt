cmake_minimum_required(VERSION 3.20)
project(jobpilot_backend CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Optimization & warnings
if(MSVC)
    add_compile_options(/W4 /WX- /EHsc /O2)
else()
    add_compile_options(-Wall -Wextra -O3)
endif()

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/install/include
    "C:/msys64/ucrt64/include"
    "C:/msys64/ucrt64/include/mariadb"
)

# Link directories
link_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/install/lib
    "C:/msys64/ucrt64/lib"
)

# Sources
set(SOURCES
    src/utils/CryptoUtils.cpp
    src/utils/DbPool.cpp
    src/repositories/Repositories.cpp
    src/services/Services.cpp
    src/middleware/AuthFilter.cpp
    src/controllers/Controllers.cpp
    src/main.cpp
)

add_executable(jobpilot_server ${SOURCES})

# Target libraries
target_link_libraries(jobpilot_server PRIVATE
    drogon
    trantor
    cares
    mariadb
    argon2
    jsoncpp
    ssl
    crypto
    z
    brotlidec
    brotlienc
    brotlicommon
    ws2_32
    crypt32
    secur32
    shlwapi
    rpcrt4
)

# Tests executable
add_executable(jobpilot_tests
    src/utils/CryptoUtils.cpp
    tests/test_units.cpp
)

target_link_libraries(jobpilot_tests PRIVATE
    argon2
    ssl
    crypto
    ws2_32
    crypt32
)
