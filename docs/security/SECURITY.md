# JobPilot Security Architecture & Hardening Guide

## 1. Threat Model & Security Posture

JobPilot is designed with a defense-in-depth security model protecting sensitive career data, recruiter interactions, user credentials, and resume documents.

```
       +---------------------------------------------+
       |               Client Browser                |
       +---------------------------------------------+
                              |
                     HTTPS (TLS 1.2 / 1.3)
                              v
       +---------------------------------------------+
       |             Nginx Reverse Proxy             |
       |  - Strict-Transport-Security (HSTS)         |
       |  - Content-Security-Policy (CSP)            |
       |  - Rate Limiting / Body Buffer Bounds (10M) |
       +---------------------------------------------+
                              |
                      Loopback (127.0.0.1)
                              v
       +---------------------------------------------+
       |             C++ Drogon Backend              |
       |  - AuthFilter: HttpOnly Cookie Extraction   |
       |  - User Isolation: Enforced user_id scoping |
       |  - Argon2id / OpenSSL CSPRNG Cryptography   |
       |  - File Upload UUID Sandboxing              |
       +---------------------------------------------+
                              |
                    Unix Socket / 127.0.0.1
                              v
       +---------------------------------------------+
       |               MySQL 8.0 Engine              |
       |  - Parameterized Queries & Escaping         |
       |  - Least Privilege User Permissions         |
       |  - Foreign Key Referential Integrity        |
       +---------------------------------------------+
```

---

## 2. Authentication & Cryptography

### 2.1 Password Hashing (Argon2id)
All user passwords are encrypted using **Argon2id**, the winner of the Password Hashing Competition (PHC) and recommended standard by OWASP for password storage.
- **Algorithm**: Argon2id
- **Version**: 0x13 (Argon2 v13)
- **Time Cost (`t_cost`)**: 2 iterations
- **Memory Cost (`m_cost`)**: 65,536 KiB (64 MiB)
- **Parallelism (`lanes`)**: 1 thread
- **Hash Output Length**: 32 bytes (256 bits)
- **Salt**: 16 bytes generated cryptographically via OpenSSL CSPRNG

Plaintext passwords are never logged, never returned in API payloads, and never retained in memory longer than the lifecycle of the login/registration request.

### 2.2 Session Security
- **Token Generation**: 256 bits (32 bytes) of cryptographic randomness acquired directly from OpenSSL `RAND_bytes`. Hex-encoded to a 64-character token.
- **Token Storage**: Only the **SHA-256 hash** of the session token is stored in the database (`user_sessions.token_hash`). If the database is compromised, active session tokens cannot be reverse-engineered.
- **Cookie Security**:
  ```http
  Set-Cookie: jobpilot_session=<64_hex_chars>; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure
  ```
  - `HttpOnly`: Immune to JavaScript document.cookie theft (XSS attacks).
  - `SameSite=Lax`: Prevents Cross-Site Request Forgery (CSRF).
  - `Secure`: Ensures cookies are transmitted only over encrypted TLS channels in production.

### 2.3 One-Time Password (OTP) Verification
- **Code Generation**: 6-digit uniform numeric code generated using OpenSSL CSPRNG (`100000` - `999999`).
- **Storage**: Only the **SHA-256 hash** is saved in `otp_verifications`.
- **Expiration**: Strict 5-minute time window.
- **Attempt Limit**: Maximum 5 attempts allowed per code before the OTP is invalidated.
- **Resend Cooldown**: Rate limited with 60-second cooldown; prior unverified OTPs are superseded.

---

## 3. Authorization & Multi-Tenant Data Isolation

### 3.1 Strict User Scoping
JobPilot is a multi-user system where all data queries are strictly scoped to the authenticated user:
1. The `AuthFilter` extracts and validates the session token, populating the request context with the verified `user_id`.
2. The controller passes this `user_id` down to the service and repository layers.
3. Every SQL query includes an explicit predicate:
   ```sql
   SELECT ... FROM applications WHERE id = ? AND user_id = ?;
   UPDATE applications SET ... WHERE id = ? AND user_id = ?;
   DELETE FROM applications WHERE id = ? AND user_id = ?;
   ```
4. Client requests attempting to supply a `user_id` in query strings or JSON payloads are completely ignored, preventing Insecure Direct Object References (IDOR).

---

## 4. Input Validation & SQL Injection Mitigation

- **Database Queries**: All dynamic parameters are escaped with `mysql_real_escape_string` before query composition, or executed via prepared statements.
- **Enum Validation**: String inputs for domain enums (`status`, `employment_type`, `interview_type`, `document_type`) are strictly checked against a whitelist of valid values before repository execution.
- **Email Normalization**: Emails are trimmed and lowercased before database querying to prevent duplicate casing exploits.

---

## 5. File Upload Defense & Path Traversal Prevention

When resumes or cover letters are uploaded:
1. **Filename Randomization**: The original user filename is never used on the filesystem. Instead, a cryptographically secure random UUID is generated (`uploads/<uuid>.<extension>`).
2. **Path Traversal Protection**: Directory traversal sequences (`../`, `..\\`) are impossible because the file path is constructed programmatically on the server without referencing the user-provided filename.
3. **MIME & Extension Whitelist**: Only allowed document types are accepted:
   - PDF (`application/pdf`, `.pdf`)
   - Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.docx`)
   - Plain Text (`text/plain`, `.txt`)
4. **Body Size Limiting**: Drogon and Nginx enforce a strict 10 MB payload ceiling (`client_max_body_size 10M;`).

---

## 6. Linux Service Sandboxing (systemd)

The production systemd unit (`deployment/systemd/jobpilot-backend.service`) implements system-level sandboxing:
- `ProtectSystem=full`: Mounts `/usr`, `/boot`, and `/etc` read-only for the service.
- `ProtectHome=true`: Prevents access to `/home`, `/root`, and `/run/user`.
- `NoNewPrivileges=true`: Disallows privilege escalation via setuid binaries.
- `PrivateTmp=true`: Isolates `/tmp` inside a private namespace.
- `LimitNOFILE=65536`: Prevents file descriptor exhaustion attacks.
