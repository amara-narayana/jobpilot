# JobPilot — Personal Career Operating System

> **High-Performance Job Application Management System built natively in C++20, Drogon, React 18, TypeScript, and MySQL 8.0.**
> Strict Zero-Docker, Zero-Node Backend, Monolithic Native Architecture.

---

## 🚀 Overview

**JobPilot** is a sophisticated, privacy-focused, cross-platform personal job application management system and career operating system. Designed for high throughput, sub-millisecond response latency, and complete user isolation, JobPilot handles your entire job search journey from discovery to offer acceptance.

### 🌟 Key Capabilities
- **Robust Authentication**: Multi-tenant account registration with memory-hard **Argon2id** password hashing and 6-digit cryptographically secure email OTP verification.
- **Application Lifecycle Engine**: Complete CRUD management supporting 7 pipeline stages (`SAVED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`), status transitions, and audit history.
- **Interactive Kanban Board**: Visual drag-and-drop workflow with optimistic cache updates and instant status reassignment.
- **Company & Recruiter Directory**: Manage target companies, interviewers, recruiter contact details, salary benchmarks, and linked applications.
- **Interview Scheduling & Calendar**: Comprehensive interview scheduling with multiple rounds (`Screening`, `Technical`, `System Design`, `Behavioral`), Google Meet/Zoom links, and an interactive monthly visual calendar.
- **Document Management**: Sandboxed storage for versioned resumes, cover letters, and portfolios with MIME validation and path traversal immunity.
- **Mathematical Career Analytics**: Live funnel conversion tracking, weekly velocity, response rates, and Recharts interactive visualizations.
- **Reminders & Background Engine**: Autonomous C++ background worker checking follow-up deadlines and dispatching alert logs.
- **Data Export & Privacy**: One-click JSON and CSV data backup export.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **C++20 / Drogon Framework** | Ultra-fast non-blocking HTTP server utilizing Trantor event loops |
| **Frontend** | **React 18 / TypeScript / Vite** | Modern client application with TanStack Query and Lucide Icons |
| **Styling** | **Tailwind CSS** | Custom glassmorphism design system supporting Dark & Light modes |
| **Database** | **MySQL 8.x** | Relational database with foreign key constraints, indexes, and ACID transactions |
| **Database Client** | **libmariadb / C++ Native Pool** | Thread-safe RAII connection pooling with parameterized SQL |
| **Security** | **Argon2id + OpenSSL** | OWASP-recommended password hashing and CSPRNG session management |
| **Deployment** | **Nginx & Systemd / Native Batch** | Native service supervision with zero Docker overhead |

---

## 📁 Repository Structure

```
jobpilot/
├── backend/                  # C++20 Drogon Application Server
│   ├── CMakeLists.txt        # Native build configuration
│   ├── include/              # Header files (Models, Controllers, Repositories, Services)
│   ├── src/                  # Implementation files
│   ├── tests/                # Automated C++ test suite
│   └── build/                # Compiled binaries (jobpilot_server, jobpilot_tests)
├── frontend/                 # React 18 + TypeScript + Vite Client
│   ├── src/
│   │   ├── app/              # App root and route configuration
│   │   ├── components/ui/    # Accessible UI primitives (Button, Modal, Input, Badge)
│   │   ├── contexts/         # AuthContext and state providers
│   │   ├── layouts/          # AppLayout (Sidebar, Navbar) & AuthLayout
│   │   ├── pages/            # 16 Complete page views
│   │   ├── services/         # Typed API clients
│   │   └── types/            # TypeScript contracts
│   └── dist/                 # Optimized production bundle
├── database/                 # MySQL CLI First
│   ├── schema/               # schema.sql (13 complete tables)
│   ├── migrations/           # 001_initial_schema.sql, 002_indexes_and_constraints.sql
│   ├── seeds/                # seeds.sql (Sample realistic pipeline data)
│   └── backups/              # Automated database dumps
├── deployment/               # Native Infrastructure & Operations
│   ├── nginx/jobpilot.conf   # Production reverse proxy config
│   ├── systemd/              # Linux systemd service unit
│   └── scripts/              # Native startup & backup scripts (.sh and .bat)
├── docs/                     # Comprehensive Documentation
│   ├── architecture/         # System architecture & Mermaid diagrams
│   ├── api/                  # Complete OpenAPI 3.0 specification
│   ├── database/             # CLI administration guide & ERD diagram
│   └── security/             # Security whitepaper & threat model
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Database Initialization (MySQL CLI First)

JobPilot prioritizes native MySQL CLI management. Run the following commands using the MySQL client:

```bash
# Log in to MySQL as root or an administrative user
mysql -u root -p

# Inside the MySQL prompt, create the database and service user:
CREATE DATABASE jobpilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jobpilot_user'@'localhost' IDENTIFIED BY 'JobPilotSecret2026!';
GRANT ALL PRIVILEGES ON jobpilot.* TO 'jobpilot_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Apply the master schema:
mysql -u jobpilot_user -p jobpilot < database/schema/schema.sql

# (Optional) Seed realistic demo data:
mysql -u jobpilot_user -p jobpilot < database/seeds/seeds.sql
```

> **Default Seed Credentials:**
> - Email: `demo@jobpilot.io`
> - Password: `Password123!`

---

### 2. Backend Build & Execution

#### On Windows (MSYS2 UCRT64):
```powershell
# Prepend MSYS2 UCRT64 toolchain to PATH
$env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH

# Navigate to backend directory
cd backend

# Configure CMake with Ninja
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release

# Compile backend binary and unit test suite
cmake --build build

# Run unit tests
.\build\jobpilot_tests.exe

# Start the application server
.\build\jobpilot_server.exe
```

#### On Linux (Ubuntu / Debian):
```bash
sudo apt update && sudo apt install -y build-essential cmake ninja-build libmariadb-dev libargon2-dev libjsoncpp-dev libssl-dev libc-ares-dev

cd backend
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build

# Run tests
./build/jobpilot_tests

# Run server
./build/jobpilot_server
```

---

### 3. Frontend Development & Build

```bash
cd frontend

# Install dependencies (already cached in repo)
npm install

# Start development preview server on http://localhost:5173
npm run dev

# Or build the optimized production bundle into frontend/dist/
npm run build
```

---

## 🚀 Production Deployment

### Windows Native Launch
Simply execute the included batch script:
```cmd
deployment\scripts\startup.bat
```

### Linux Native Service (systemd)
```bash
# Copy systemd unit file
sudo cp deployment/systemd/jobpilot-backend.service /etc/systemd/system/

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable --now jobpilot-backend

# Check status
sudo systemctl status jobpilot-backend
```

### Nginx Reverse Proxy Setup
```bash
# Link configuration
sudo ln -s /var/www/jobpilot/deployment/nginx/jobpilot.conf /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Security Summary

- **Argon2id**: Memory-hard key derivation prevents GPU/ASIC password cracking.
- **HttpOnly Cookies**: Session cookies cannot be accessed by client-side JavaScript.
- **SameSite=Lax & CSRF**: All sensitive endpoints validate origin and session authenticity.
- **Scoped Multi-Tenancy**: Every database transaction strictly queries `WHERE user_id = ?`.
- **Upload Isolation**: Files are assigned random UUIDs on disk, eliminating path traversal risks.

For full details, refer to [docs/security/SECURITY.md](docs/security/SECURITY.md).

---

## 📖 Documentation Reference

- **[System Architecture](docs/architecture/ARCHITECTURE.md)**: Deep dive into the Drogon event loops, data flow, and concurrency model.
- **[REST API Specification](docs/api/OPENAPI.yaml)**: OpenAPI 3.0 specification covering all endpoints.
- **[Database Administration Guide](docs/database/DATABASE_ADMINISTRATION.md)**: Native MySQL CLI commands for migrations, indexing, and performance queries.
- **[Entity Relationship Diagram (ERD)](docs/database/ERD.md)**: Visual Mermaid ER diagram and table relationships.
- **[Security Architecture](docs/security/SECURITY.md)**: Threat modeling, sandboxing, and cryptographic details.
- **[Project Status Tracker](docs/PROJECT_STATUS.md)**: Detailed phase-by-phase implementation ledger.

---

## 📄 License
JobPilot is released under the **MIT License**.
