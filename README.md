# DevAssess — Developer Assessment & Coding Platform (Backend API)

Welcome to **DevAssess**, a production-ready, backend-heavy RESTful API engineered for modern technical recruitment and developer assessment workflows. The platform empowers companies and recruiters to publish coding assessments, curate problem banks, invite candidates, conduct timed evaluations with anti-cheat detection, and purchase assessment credits via bKash payment processing.

---

## 📌 Project Overview

Hiring software engineers requires rigorous, fair, and timed technical evaluation. DevAssess bridges the gap between recruiters and developer talent by providing:
- **Role-Based Workspaces**: Tailored workflows for `ADMIN`, `RECRUITER`, and `CANDIDATE`.
- **Credit-Based Monetization**: Recruiters purchase assessment credits through a real bKash payment gateway.
- **Resilient Infrastructure**: Token and OTP state caching with Redis, secure media storage with Cloudinary, and robust transactional integrity with PostgreSQL and Prisma.
- **Integrity & Auditing**: Live anti-cheat event tracking (tab-switching flags) and system-wide administrative audit logging.

---

## 🔗 Quick Links

- **Repository**: [GitHub Repository](https://github.com/provash10/B7A6-Developer-Assessment-Coding-Platform)
- **Live API Endpoint**: `https://a6-developer-assessment-coding-platform.vercel.app` *(or your deployed URL)*
- **Postman Documentation**: Included inside the repository as `A6 Developer Assessment Coding Platform.postman_collection.json`
- **Video Walkthrough**: *(Add your 3–5 min video link here)*

---

## 🛠️ Technology Stack

| Domain | Technology | Why It Was Chosen |
| :--- | :--- | :--- |
| **Runtime & Language** | **Node.js & TypeScript** | Type safety, maintainability, and enterprise-grade code predictability |
| **Web Framework** | **Express.js (v5)** | Battle-tested, minimalist REST API routing architecture |
| **Database & ORM** | **PostgreSQL & Prisma ORM** | Relational integrity, Prisma schema migrations, and transactions |
| **Cache & Temporary State** | **Redis** | High-performance 5-minute OTP caching and bKash token TTL caching |
| **Media & File Storage** | **Multer & Cloudinary** | In-memory file processing and secure cloud delivery for resumes and logos |
| **Payment Gateway** | **bKash Tokenized Checkout** | Real merchant payment lifecycle (Token Grant → Create → Execute) |
| **Authentication** | **JWT & Google OAuth (GCP)** | Dual-layer access/refresh token rotation + Google identity verification |
| **Input Validation** | **Zod** | Strict runtime request body and query parameter validation |
| **Transactional Email** | **Nodemailer + EJS** | Templated HTML emails for invitations, OTPs, and notifications |
| **Security Suite** | **Helmet, CORS & Rate Limiting** | DDoS and abuse prevention (`express-rate-limit`), secure headers |
| **Linting & Formatting** | **Biome** | Sub-second linter and code style enforcement |

---

## 👥 Roles & Permissions Matrix

The system enforces 3 fixed roles using custom role-based access control (RBAC) middleware:

| Feature / Action | Admin | Recruiter | Candidate |
| :--- | :---: | :---: | :---: |
| **Manage Users & Change Roles** | ✅ | ❌ | ❌ |
| **View Audit Logs & Platform Stats** | ✅ | ❌ | ❌ |
| **Create & Edit Question Bank** | ✅ | ✅ | ❌ |
| **Create Assessments & Add Problems** | ✅ | ✅ | ❌ |
| **Purchase Credits via bKash** | ❌ | ✅ | ❌ |
| **Send Assessment Invitations** | ✅ | ✅ | ❌ |
| **View Assessment Leaderboards** | ✅ | ✅ | ❌ |
| **Upload Company Logo** | ❌ | ✅ | ❌ |
| **Accept Invitation & Start Timed Attempt** | ❌ | ❌ | ✅ |
| **Submit Answers & Code Solutions** | ❌ | ❌ | ✅ |
| **Log Anti-Cheat Window Blurs** | ❌ | ❌ | ✅ |
| **Upload Resume Document** | ❌ | ❌ | ✅ |
| **View Own Attempt Results & Scores** | ✅ | ✅ | ✅ |

---

## 🔑 Demo Seed Credentials

You can instantly seed the database with test accounts using `npm run db:seed`:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@100.com` | `Password@100` | Full platform analytics, audit trail, user role changes |
| **RECRUITER** | `recruiter@100.com` | `Password@100` | Create assessments, bKash credit purchase, invitations |
| **CANDIDATE** | `candidate@100.com` | `Password@100` | Accept invitations, take timed tests, upload resume |

---

## 🚀 Key Business Workflows

### 1. Recruiter Assessment & Candidate Workflow
```
Recruiter Buys Credits (bKash) 
       ▼
Creates Assessment & Selects Questions
       ▼
Sends Email Invitations to Candidates (Nodemailer)
       ▼
Candidate Accepts & Starts Timed Attempt
       ▼
Candidate Submits Answers (Anti-cheat events recorded)
       ▼
Automatic Score Evaluation & Leaderboard Generation
```

### 2. Redis-Powered OTP Password Reset
1. User requests password reset (`POST /api/v1/auth/forgot-password`).
2. A cryptographically generated 6-digit OTP is stored in **Redis** with a strict 5-minute TTL (`EX: 300`).
3. Nodemailer sends a templated EJS email with the code.
4. User submits the OTP and new password (`POST /api/v1/auth/reset-password`).
5. Backend verifies against Redis, resets the password hash, and instantly flushes the OTP key to prevent replay attacks.

### 3. bKash Distributed Token Caching
- Eliminates redundant API calls to bKash servers.
- `id_token` is cached in Redis with a 1-hour expiration; `refresh_token` is cached with a 28-day expiration.
- If an `id_token` is within 10 minutes of expiry, the backend automatically uses the `refresh_token` to renew it.

---

## 📋 Complete API Directory (48+ Endpoints)

### 🔐 Authentication Module (`/api/v1/auth`)
- `POST /register` — Register a new account (`CANDIDATE` or `RECRUITER`).
- `POST /login` — Authenticate and receive accessToken & refreshToken in cookies + body.
- `POST /refresh-token` — Rotate access token using valid refresh token.
- `POST /logout` — Clear auth cookies and terminate session.
- `POST /forgot-password` — Generate & dispatch 6-digit OTP stored in Redis (5 min TTL).
- `POST /reset-password` — Verify Redis OTP and update password.
- `POST /change-password` — Update password for currently logged-in user.
- `POST /google-login` — Verify Google OAuth ID token and log in / auto-register.

### 👤 User & Profile Module (`/api/v1/users`)
- `GET /me` — Retrieve profile data of logged-in user with sub-profiles.
- `PATCH /me` — Update name, phone, bio, or company profile fields.
- `PATCH /profile-image` — Upload avatar to Cloudinary via Multer.
- `PATCH /resume` — Candidates upload resume documents to Cloudinary.
- `PATCH /company-logo` — Recruiters upload corporate branding to Cloudinary.
- `GET /` — Admin retrieves paginated, filtered user list.
- `PATCH /:id/role` — Admin updates user role (logged in Audit Log).

### ❓ Question Bank Module (`/api/v1/questions`)
- `POST /` — Create coding, MCQ, or subjective question.
- `GET /` — List questions with search, tag filters, difficulty, and pagination.
- `GET /:id` — Get question details and test cases.
- `PATCH /:id` — Update question prompt, test cases, or options.
- `DELETE /:id` — Soft-delete question.

### 📝 Assessment Module (`/api/v1/assessments`)
- `POST /` — Create an assessment with duration, passing score, and metadata.
- `GET /` — Browse published assessments with pagination and filters.
- `GET /:id` — Retrieve assessment overview and attached questions.
- `PATCH /:id` — Modify assessment settings.
- `POST /:id/questions` — Attach question from bank to assessment.
- `DELETE /:id/questions/:questionId` — Detach question from assessment.
- `DELETE /:id` — Soft-delete assessment.
- `GET /:id/leaderboard` — View ranking table with scores, completion times, and status.

### ✉️ Invitation Module (`/api/v1/invitations`)
- `POST /` — Recruiter invites a candidate by email (deducts assessment credits).
- `GET /` — List invitations sent by recruiter or all invitations (Admin).
- `GET /my` — Candidate views invitations addressed to them.
- `GET /:id` — View single invitation details.
- `PATCH /:id/accept` — Candidate accepts invitation and initializes their attempt session.
- `DELETE /:id` — Cancel / withdraw invitation.

### ⏱️ Candidate Attempt Module (`/api/v1/attempts`)
- `GET /my` — Candidate retrieves assessment history.
- `POST /:id/start` — Start the assessment timer (validates window).
- `GET /:id/questions` — Fetch exam questions during an active timed session.
- `POST /:id/submit-answer` — Submit response for a question.
- `POST /:id/anti-cheat` — Log tab-switching / window blur event count.
- `POST /:id/finish` — Complete attempt, lock submissions, and compute score.
- `GET /:id/result` — Fetch detailed scorecard, answers, and anti-cheat summary.

### 💳 Payment Module (`/api/v1/payments`)
- `GET /bkash-token` — Verify / inspect cached bKash token from Redis.
- `POST /initiate` — Initiate bKash checkout session to purchase credits (`credits: number`).
- `GET /callback` & `POST /callback` — Handle bKash success, fail, or cancel callbacks.
- `GET /my-transactions` — Recruiter views purchase history.
- `GET /all-transactions` — Admin views all financial transactions.
- `GET /:id` — Detailed transaction receipt.

### 🛡️ Admin & Audit Module (`/api/v1/admin`)
- `GET /dashboard-stats` — Platform-wide metrics (users, attempts, revenue, assessments).
- `GET /audit-logs` — Paginated system change history and security logs.

---

## ⚙️ Local Development Setup

Follow these steps to run DevAssess locally:

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL** database instance (local or hosted on Neon/Supabase)
- **Redis** instance (local or hosted on Redis Cloud/Upstash)
- **Cloudinary** account credentials

### 2. Clone and Install
```bash
git clone https://github.com/provash10/B7A6-Developer-Assessment-Coding-Platform.git
cd "A6 Developer Assessment Coding Platform"
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory following `.env.example`:
```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/assessment_db?sslmode=require"

# JWT Authentication
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10

# URLs
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

# Redis Configuration
REDIS_USER="default"
REDIS_PASSWORD="your_redis_password"
REDIS_HOST="your_redis_host"
REDIS_PORT=16284

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Nodemailer / SMTP
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
EMAIL_SENDER="your_email@gmail.com"

# bKash Sandbox
BKASH_BASE_URL="https://tokenized.sandbox.bka.sh/v1.2.0-beta"
BKASH_USERNAME="sandboxTokenizedUser02"
BKASH_PASSWORD="sandboxTokenizedUser02@12345"
BKASH_APP_KEY="your_bkash_key"
BKASH_APP_SECRET="your_bkash_secret"
BKASH_CALLBACK_URL="http://localhost:5000/api/v1/payments/callback"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to your database
npx prisma db push

# Seed initial admin, recruiter, and candidate demo users
npm run db:seed
```

### 5. Run the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production build & start
npm run build
npm run start
```

Server will start on `http://localhost:5000`.

---

## 🧪 Testing with Postman

1. Open **Postman**.
2. Click **Import** in the top-left corner.
3. Select `A6 Developer Assessment Coding Platform.postman_collection.json` located in the project root.
4. Set up an environment with `base_url = http://localhost:5000/api/v1`.
5. Execute requests across **Auth**, **User**, **Question**, **Assessment**, **Attempt**, and **Payment** folders.

---

## 🛡️ Best Practices & Quality Assurance

- **Input Sanitization**: Every user input is strictly validated through Zod schemas before touching service layers.
- **Defensive Error Handling**: Centralized error middleware captures custom `AppError`, Prisma exceptions, and Zod validation errors, returning unified JSON structures.
- **Graceful Lifecycle Management**: Server startup verifies both PostgreSQL and Redis connections; process exit hooks cleanly disconnect open sockets.
- **Audit Trails**: Critical operations (e.g., role escalations, assessment edits) record actor ID, previous values, new values, and client IP.

---

## 👨‍💻 Author

Crafted with dedication by **Provash Chandra Barman**  
*Full Stack / Backend Engineer*  
GitHub: [@provash10](https://github.com/provash10)
