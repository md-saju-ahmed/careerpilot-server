# CareerPilot Server

The backend API for **CareerPilot**, a job board and career-development platform. It provides job listings, a full recruiter-facing hiring workflow (company profiles, job publishing, and applicant tracking), user profiles, an admin panel, and AI-powered career tools (career advice, cover letter generation, and resume building), backed by MongoDB and secured with JWT verification against an external Better Auth identity provider.

> Note: This repository is the **server (API) only**. The frontend/client application (including authentication via Better Auth) lives in a separate repository and is not part of this codebase.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Database Models](#database-models)
- [AI Features/Integrations](#ai-featuresintegrations)
- [Validation & Error Handling](#validation--error-handling)
- [Security Features](#security-features)
- [Deployment Guide](#deployment-guide)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

CareerPilot Server is a TypeScript/Express REST API that powers a job board application. It exposes endpoints for browsing and managing job listings, maintaining user profiles (education, experience, skills), saving and applying to jobs, submitting and moderating testimonials, handling contact form submissions, and serving dashboard analytics. It also integrates with Google's Gemini AI models to generate personalized career advice and cover letters.

The API does not manage its own user accounts or sessions. Instead, it trusts a **Better Auth** identity provider (run by the companion client application) as the source of truth for authentication, and verifies incoming requests using JWTs validated against that provider's JWKS endpoint. User-facing records such as role and account status are read directly from Better Auth's MongoDB collections.

## Features

- **Job board**: create, update, list, filter, sort, and paginate job postings; save jobs; apply to jobs; view related jobs by category.
- **Job publishing workflow**: jobs move through `draft` → `published` → `closed` states. Only jobs in `published` status are visible to job seekers or open for applications; recruiters manage their own postings through every stage, and admins can moderate (approve/reject/reset) any job.
- **Recruiter accounts & approval**: users with the `recruiter` role maintain a company profile (name, website, size, industry, description) and must be approved by an admin (`recruiterStatus`) before they can publish jobs or review applicants. Suspending or rejecting a recruiter immediately closes their published jobs and revokes their active sessions.
- **Applications tracking**: job seekers can view their own application history; recruiters can list and paginate applicants for their job postings and move each applicant through a status pipeline (`applied` → `reviewing` → `shortlisted`/`rejected`/`hired`).
- **Profile management**: personal info, skills, education history, and work experience, each independently editable.
- **AI Career Advisor**: generates a structured career assessment (summary, matching roles, skill gaps, learning roadmap, salary insight, interview tips) from a candidate's skills, experience, and target role. Requests are context-aware: callers can exclude previously-suggested roles or focus on a specific skill to refine results, and a history endpoint returns the caller's recent requests.
- **AI Cover Letter Generator**: generates a ready-to-send cover letter tailored by tone and length, using the candidate's profile and stated skills/experience.
- **AI Resume Builder**: generates a complete, ATS-friendly plain-text resume (summary, skills, experience, education, achievements) from candidate-supplied details, falling back to the user's stored profile name when one isn't provided.
- **Testimonials**: authenticated users submit reviews that require admin approval before being publicly listed.
- **Contact form**: public, rate-limited message submissions with admin review/resolution workflow.
- **Categories**: dynamically managed job categories (used for filtering and job creation validation), with auto-seeding of sensible defaults.
- **Admin panel API**: user management (list/suspend/reactivate/delete), recruiter approval management, job moderation, testimonial moderation, category management, and platform settings.
- **Dashboard analytics**: role-aware summary (personal stats for job seekers, hiring stats for recruiters, platform-wide stats for admins), category breakdown, a six-month job posting trend, and recent job listings. A public stats endpoint is also available for unauthenticated visitors.
- **Public platform settings**: site name, support email, maintenance mode, and registration availability, exposed on a public, unauthenticated endpoint.

## Tech Stack

| Layer               | Technology                                                           |
| ------------------- | -------------------------------------------------------------------- |
| Language            | TypeScript (strict mode, ES2022, native ESM)                         |
| Runtime             | Node.js (>=18)                                                       |
| Web framework       | Express 5                                                            |
| Database            | MongoDB via Mongoose 9                                               |
| Authentication      | Better Auth (external) — JWT verification via `jose` and remote JWKS |
| Validation          | Zod 4                                                                |
| AI provider         | Google Gemini (`@google/genai`)                                      |
| Security middleware | Helmet, CORS, `express-rate-limit`                                   |
| Logging             | Morgan                                                               |
| Dev tooling         | `tsx` (dev watch mode), native `tsc` build                           |
| Deployment target   | Vercel (serverless Node functions)                                   |

## Architecture Overview

The application follows a **modular, layered architecture**, with each business domain isolated under `src/modules/<domain>`. Every module generally follows the same internal pattern:

- **`*.routes.ts`** — defines Express routes, wires up middleware (auth, validation, ownership, role checks).
- **`*.controller.ts`** — thin HTTP layer; extracts request data, calls the service layer, and shapes the response via `ApiResponse`.
- **`*.service.ts`** — business logic and database access (Mongoose queries/aggregations).
- **`*.model.ts`** — Mongoose schema and model definitions.
- **`*.validators.ts`** — Zod schemas for request body/params/query validation, plus inferred TypeScript types.

Cross-cutting concerns are centralized in `src/lib` (error handling primitives, response wrapper, async handler, role definitions, JWKS client) and `src/middlewares` (authentication, ownership, role guards, validation, 404/error handling).

**Request lifecycle:**

1. Request hits `app.ts`, passing through Helmet, CORS, a per-request MongoDB connection guarantee, JSON/urlencoded parsing, cookie parsing, and Morgan logging.
2. A global rate limiter applies to all `/api` routes.
3. The request is routed to the relevant module via `src/routes/index.ts`.
4. Route-level middleware runs: `protect`/`optionalAuth` (JWT verification), `validate` (Zod schema), `requireRole`/`requireOwnership` (authorization) as applicable.
5. The controller calls the service layer, which performs the database/AI work and returns plain data.
6. The controller wraps the result in `ApiResponse` and sends a consistent JSON envelope.
7. Unmatched routes fall through to `notFound`, and all errors are caught by the centralized `errorHandler`.

**Deployment duality**: `src/server.ts` boots a long-running HTTP server for local development (`app.listen`), while `api/index.ts` exports the same Express app as a handler for Vercel's serverless Node runtime — no `app.listen()` is called in that path.

## Folder Structure

```
careerpilot-server/
├── api/
│   └── index.ts                     # Vercel serverless entrypoint (exports the Express app)
├── src/
│   ├── app.ts                       # Express app factory: middleware, routes, error handling
│   ├── server.ts                    # Local dev entrypoint (app.listen)
│   ├── config/
│   │   ├── env.ts                   # Zod-validated environment variables
│   │   └── db.ts                    # MongoDB connection (idempotent, serverless-safe)
│   ├── lib/
│   │   ├── ApiError.ts              # Custom operational error class
│   │   ├── ApiResponse.ts           # Standardized success response envelope
│   │   ├── asyncHandler.ts          # Wraps async route handlers for error forwarding
│   │   ├── jwks.ts                  # Remote JWKS client for JWT verification
│   │   ├── params.ts                # Required-path-param helper
│   │   ├── roles.ts                 # Known role definitions ("user", "recruiter", "admin")
│   │   └── session.ts               # `revokeSessionsForUser` — session cleanup helper
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # `protect` and `optionalAuth` (JWT + live user status/role/recruiterStatus check)
│   │   ├── ownership.middleware.ts  # `requireOwnership` (resource-owner or admin check)
│   │   ├── requireRole.middleware.ts# Role-based access guard
│   │   ├── requireRecruiterApproved.middleware.ts # Blocks unapproved recruiters from job/applicant actions
│   │   ├── validate.middleware.ts   # Zod-based request validation
│   │   ├── notFound.middleware.ts   # 404 handler
│   │   └── errorHandler.middleware.ts # Centralized error handler
│   ├── modules/
│   │   ├── jobs/                    # Job postings (draft/published/closed), saved jobs, application records
│   │   ├── applications/            # Applicant listing (recruiter) + application history (job seeker)
│   │   ├── recruiter/                # Recruiter company profile management
│   │   ├── profile/                 # User profile, education, experience
│   │   ├── categories/              # Job categories
│   │   ├── testimonials/            # User testimonials + moderation
│   │   ├── contact/                 # Public contact form + admin inbox
│   │   ├── dashboard/               # Analytics summaries (user/recruiter/admin/public)
│   │   ├── admin/                   # User & recruiter management, job moderation, platform settings, admin read models
│   │   ├── settings/                # Public (unauthenticated) settings endpoint
│   │   └── ai/
│   │       ├── provider.ts          # Centralized Gemini client wrapper
│   │       ├── aiUsage.model.ts     # AI usage/audit log
│   │       ├── career-advisor/      # AI career advice feature
│   │       ├── cover-letter/        # AI cover letter feature
│   │       └── resume/              # AI resume builder feature
│   ├── routes/
│   │   └── index.ts                 # Mounts all module routers under /api
│   └── types/
│       └── express.d.ts             # Express `Request.user` type augmentation (includes `recruiterStatus`)
├── .env.example                     # Environment variable template
├── package.json
├── tsconfig.json
├── vercel.json                      # Vercel build/rewrite configuration
├── LICENSE                          # MIT license text
└── .gitignore
```

Each module under `src/modules/` (with the exception of `settings`, which is route-only, and `ai`, which contains shared AI infrastructure alongside its three features) consistently contains its own `*.controller.ts`, `*.routes.ts`, `*.service.ts`, `*.validators.ts`, and, where the module owns data, `*.model.ts`.

## Installation & Setup

### Prerequisites

- Node.js **>= 18** (as declared in `package-lock.json`'s `engines` field)
- A MongoDB database (e.g., MongoDB Atlas)
- A running Better Auth instance (typically the companion CareerPilot client app) exposing a JWKS endpoint at `${CLIENT_URL}/api/auth/jwks`
- A Google Gemini API key (optional — required only for the AI Career Advisor and Cover Letter features)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/md-saju-ahmed/careerpilot-server.git
cd careerpilot-server

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then edit .env with your own values (see "Environment Variables" below)

# 4. Run in development mode (auto-restart on changes)
npm run dev

# 5. Or build and run in production mode
npm run build
npm start
```

Once running, verify the server is up:

```bash
curl http://localhost:5000/health
# {"status":"ok"}
```

## Environment Variables

Defined and validated in `src/config/env.ts` using Zod. The server will refuse to start if required variables are missing or invalid.

| Variable         | Required | Default       | Description                                                                                                                                                                                |
| ---------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`       | No       | `development` | One of `development`, `production`, `test`. Affects logging format and error verbosity.                                                                                                    |
| `PORT`           | No       | `5000`        | Port the local dev server listens on (not used in the Vercel serverless deployment).                                                                                                       |
| `DATABASE_URL`   | **Yes**  | —             | MongoDB connection string.                                                                                                                                                                 |
| `CLIENT_URL`     | **Yes**  | —             | Base URL of the Better Auth client app. Must be a valid URL. Used for CORS origin, JWT issuer/audience validation, and to construct the JWKS endpoint URL (`${CLIENT_URL}/api/auth/jwks`). |
| `GEMINI_API_KEY` | No       | —             | Google Gemini API key. Required only for the AI Career Advisor and Cover Letter endpoints; other endpoints work without it.                                                                |

See `.env.example` for a template.

## Available Scripts

Defined in `package.json`:

| Script          | Command                   | Description                                                         |
| --------------- | ------------------------- | ------------------------------------------------------------------- |
| `npm run dev`   | `tsx watch src/server.ts` | Runs the server locally with hot-reload on file changes.            |
| `npm run build` | `tsc`                     | Type-checks and compiles TypeScript to `dist/` per `tsconfig.json`. |
| `npm start`     | `node dist/src/server.js` | Runs the compiled production build.                                 |

## API Overview

All routes are mounted under the `/api` prefix (see `src/routes/index.ts`), in addition to an unprefixed `GET /health` check. A global rate limiter (100 requests/minute per client) applies to all `/api` routes.

### Health

| Method | Path      | Auth | Description                                  |
| ------ | --------- | ---- | -------------------------------------------- |
| GET    | `/health` | None | Liveness check; does not touch the database. |

### Jobs — `/api/jobs`

Jobs carry a `status` of `draft`, `published`, or `closed`. Non-owners and non-admins only ever see `published` jobs (in listings, by slug, and as "related jobs"), and applications are only accepted against `published` jobs.

| Method | Path         | Auth                              | Description                                                                                                                                                                                          |
| ------ | ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`          | Optional                          | List jobs with search, filters (category, location, experience, employment type, min salary, skills, and `mine=true` to restrict to the authenticated user's own postings), sorting, and pagination. |
| GET    | `/saved`     | Required                          | List the authenticated user's saved jobs (paginated).                                                                                                                                                |
| GET    | `/:slug`     | Optional                          | Get a single job by slug, including related published jobs in the same category.                                                                                                                     |
| POST   | `/`          | Required + `recruiter` (approved) | Create a new job posting (starts as `draft`).                                                                                                                                                        |
| PATCH  | `/:id`       | Required + Ownership              | Update a job's details or status. Setting `status: "published"` requires an approved recruiter (or admin) account.                                                                                   |
| PATCH  | `/:id/save`  | Required                          | Toggle saving/unsaving a job.                                                                                                                                                                        |
| POST   | `/:id/apply` | Required                          | Apply to a published job (duplicate applications rejected).                                                                                                                                          |
| DELETE | `/:id`       | Required + Ownership              | Delete a job (only the creator or an admin).                                                                                                                                                         |

### Applications — `/api/applications`

| Method | Path          | Auth                                      | Description                                                                                                                                   |
| ------ | ------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/mine`       | Required + `user` role                    | List the authenticated job seeker's own applications, paginated.                                                                              |
| PATCH  | `/:id/status` | Required + Ownership + Approved recruiter | Update an applicant's status (`applied`/`reviewing`/`shortlisted`/`rejected`/`hired`). Ownership is checked against the parent job's creator. |

Applicants for a specific job are listed via `GET /api/jobs/:id/applicants` (mounted separately in `src/routes/index.ts`), restricted to that job's owning recruiter or an admin.

### Recruiter — `/api/recruiter` (all routes require authentication + `recruiter` role)

| Method | Path       | Description                                                |
| ------ | ---------- | ---------------------------------------------------------- |
| GET    | `/profile` | Get the recruiter's own company profile.                   |
| PATCH  | `/profile` | Create or update the recruiter's company profile (upsert). |

### Profile — `/api/profile` (all routes require authentication)

| Method | Path                   | Description                                                        |
| ------ | ---------------------- | ------------------------------------------------------------------ |
| GET    | `/`                    | Get (or lazily create) the current user's profile.                 |
| PATCH  | `/`                    | Update personal info (name, phone, role, address, gender, avatar). |
| PUT    | `/skills`              | Replace the full skills list.                                      |
| POST   | `/education`           | Add an education entry.                                            |
| PATCH  | `/education/:entryId`  | Update an education entry.                                         |
| DELETE | `/education/:entryId`  | Delete an education entry.                                         |
| POST   | `/experience`          | Add an experience entry.                                           |
| PATCH  | `/experience/:entryId` | Update an experience entry.                                        |
| DELETE | `/experience/:entryId` | Delete an experience entry.                                        |

### Categories — `/api/categories`

| Method | Path           | Auth | Description                                         |
| ------ | -------------- | ---- | --------------------------------------------------- |
| GET    | `/`            | None | List all categories (auto-seeds defaults if empty). |
| GET    | `/with-counts` | None | List categories with the number of jobs in each.    |

### Testimonials — `/api/testimonials`

| Method | Path | Auth     | Description                                                                                                         |
| ------ | ---- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`  | None     | List approved testimonials (paginated by `limit`).                                                                  |
| POST   | `/`  | Required | Submit a testimonial (name/role are derived from the user's profile, not client input); starts in `pending` status. |

### Contact — `/api/contact`

| Method | Path   | Auth                                     | Description                                                         |
| ------ | ------ | ---------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/`    | None (rate-limited: 5 requests / 15 min) | Submit a public contact form message.                               |
| GET    | `/`    | Admin                                    | List contact submissions, filterable by resolved status, paginated. |
| PATCH  | `/:id` | Admin                                    | Toggle a submission's resolved state.                               |

### Dashboard — `/api/dashboard`

| Method | Path            | Auth     | Description                                                                                                                                        |
| ------ | --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/summary`      | Required | Role-aware summary: personal stats for regular users, platform-wide stats for admins, plus category breakdown, 6-month job trend, and recent jobs. |
| GET    | `/public-stats` | None     | Public aggregate counts: total jobs, users, applications, and distinct companies.                                                                  |

### Settings — `/api/settings`

| Method | Path | Auth | Description                                                                                       |
| ------ | ---- | ---- | ------------------------------------------------------------------------------------------------- |
| GET    | `/`  | None | Public platform settings (site name, support email, maintenance mode, registration availability). |

### AI — Career Advisor — `/api/ai/career-advisor`

| Method | Path       | Auth     | Description                                                                                                                                     |
| ------ | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/`        | Required | Generate structured career advice from skills, experience, and target role. Accepts optional `excludeRoles` and `focusSkill` to refine results. |
| GET    | `/history` | Required | Return the caller's last 5 career-advisor requests (target role, matched roles, skill gaps, exclusions).                                        |

### AI — Cover Letter — `/api/ai/cover-letter`

| Method | Path | Auth     | Description                                                         |
| ------ | ---- | -------- | ------------------------------------------------------------------- |
| POST   | `/`  | Required | Generate a cover letter for a given company/role, tone, and length. |

### AI — Resume Builder — `/api/ai/resume`

| Method | Path | Auth     | Description                                                                                                  |
| ------ | ---- | -------- | ------------------------------------------------------------------------------------------------------------ |
| POST   | `/`  | Required | Generate a plain-text, ATS-friendly resume from a target role plus skills/experience/education/achievements. |

### Admin — `/api/admin` (all routes require authentication + `admin` role)

| Method | Path                     | Description                                                                                                                                                                                  |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/users`                 | List users (search by name/email, paginated).                                                                                                                                                |
| PATCH  | `/users/:id/status`      | Suspend or reactivate a user (cannot target self; suspension also revokes active sessions).                                                                                                  |
| DELETE | `/users/:id`             | Delete a user and associated auth records (cannot target self).                                                                                                                              |
| GET    | `/recruiters`            | List recruiter accounts, filterable by `recruiterStatus`, paginated.                                                                                                                         |
| PATCH  | `/recruiters/:id/status` | Set a recruiter's `recruiterStatus` (`pending`/`approved`/`rejected`/`suspended`; cannot target self). Revokes the recruiter's active sessions; suspending also closes their published jobs. |
| PATCH  | `/jobs/:id/status`       | Approve (`published`), reject (`closed`), or reset (`draft`) a job posting.                                                                                                                  |
| GET    | `/testimonials`          | List testimonials filterable by status, paginated.                                                                                                                                           |
| PATCH  | `/testimonials/:id`      | Approve, reject, or reset a testimonial's status.                                                                                                                                            |
| GET    | `/categories`            | List categories.                                                                                                                                                                             |
| POST   | `/categories`            | Create a category.                                                                                                                                                                           |
| PATCH  | `/categories/:id`        | Update a category (renaming propagates to all jobs using it).                                                                                                                                |
| DELETE | `/categories/:id`        | Delete a category (blocked if jobs still reference it).                                                                                                                                      |
| GET    | `/settings`              | Get full platform settings.                                                                                                                                                                  |
| PUT    | `/settings`              | Update platform settings.                                                                                                                                                                    |

### Response Format

All successful responses follow a consistent envelope produced by `ApiResponse`:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Error responses follow the format produced by the global error handler:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "details": {}
}
```

`details` is included only when present (e.g., Zod validation errors), and a `stack` field is additionally included when `NODE_ENV=development`.

## Authentication & Authorization

Authentication is **not** implemented in this server. Instead, the API acts as a resource server that trusts JSON Web Tokens issued by an external **Better Auth** identity provider (the companion client application):

1. Clients send a `Bearer` token in the `Authorization` header.
2. `protect` (required auth) and `optionalAuth` (optional auth) middlewares verify the token's signature using `jose`'s `createRemoteJWKSet`, fetched from `${CLIENT_URL}/api/auth/jwks`, and validate the `issuer` and `audience` against `CLIENT_URL`.
3. Rather than trusting the role/status embedded in the token, the middleware performs a **live lookup** of the user's current `status`, `role`, and `recruiterStatus` directly against Better Auth's `user` collection (via a schema-less Mongoose read model, `UserReadModel`) on every authenticated request. This ensures role changes, suspensions, recruiter approval changes, or account deletions take effect immediately, without waiting for token expiry.
4. Requests for suspended accounts are rejected with `403`; requests referencing a deleted account are rejected with `401`; unrecognized roles are rejected with `403` (or silently treated as anonymous on optional-auth routes).

**Authorization** is layered on top of authentication via three additional middlewares:

- **`requireRole(...roles)`** — restricts a route to one or more roles (e.g., `admin`, `recruiter`). All `/api/admin/*` routes require the `admin` role; all `/api/recruiter/*` routes require the `recruiter` role.
- **`requireOwnership(getResourceOwnerId)`** — ensures the authenticated user owns the target resource (e.g., a job or application) before allowing mutation, unless they are an admin, who bypasses the check. Used for job updates/deletion and applicant status changes.
- **`requireRecruiterApproved`** — restricts a route to recruiters whose `recruiterStatus` is `approved`, rejecting non-recruiters and pending/rejected/suspended recruiters alike. Used for publishing jobs and managing applicants.

Supported roles (`src/lib/roles.ts`): `user`, `recruiter`, `admin`. Recruiters additionally carry a `recruiterStatus` of `pending`, `approved`, `rejected`, or `suspended`, set by an admin.

## Database Models

All models are Mongoose schemas. Timestamps and IDs are transformed to a client-friendly shape (`id` instead of `_id`, ISO date strings) via `toJSON` transforms where applicable.

| Model              | Collection                        | Purpose                                                     | Key Fields                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Job`              | `jobs`                            | Job postings                                                | `slug` (unique), `title`, `company`, `location`, `category`, `employmentType` (enum), `experience`, `salaryMin/Max`, `skills[]`, `shortDescription`, `description` (Markdown), `deadline`, `postedAt`, `createdBy`, `status` (`draft`/`published`/`closed`, indexed with `postedAt`) |
| `SavedJob`         | `savedjobs`                       | User-saved jobs (many-to-many between users and jobs)       | `userId`, `jobId` (unique compound index)                                                                                                                                                                                                                                            |
| `Application`      | `applications`                    | Job applications                                            | `userId`, `jobId` (unique compound index, prevents duplicate applications; also indexed alone for recruiter applicant lookups), `status` (`applied`/`reviewing`/`shortlisted`/`rejected`/`hired`), `statusUpdatedAt`                                                                 |
| `RecruiterProfile` | `recruiterprofiles`               | Recruiter company profile                                   | `userId` (unique), `companyName`, `companyWebsite`, `companySize`, `industry`, `logoUrl`, `description`, `verificationNote`                                                                                                                                                          |
| `Profile`          | `profiles`                        | User profile data                                           | `userId` (unique), `name`, `email`, `phone`, `role`, `address`, `gender`, `avatarUrl`, `skills[]`, `education[]` (subdocuments), `experience[]` (subdocuments)                                                                                                                       |
| `Category`         | `categories`                      | Job categories                                              | `name` (unique), `slug` (unique), `icon` (enum), `order`                                                                                                                                                                                                                             |
| `Testimonial`      | `testimonials`                    | User testimonials                                           | `userId`, `name`, `role`, `rating` (1–5), `review`, `status` (`pending`/`approved`/`rejected`)                                                                                                                                                                                       |
| `Contact`          | `contacts`                        | Contact form submissions                                    | `name`, `email`, `message`, `resolved`                                                                                                                                                                                                                                               |
| `Settings`         | `settings`                        | Singleton platform settings document                        | `siteName`, `supportEmail`, `maintenanceMode`, `allowRegistrations`                                                                                                                                                                                                                  |
| `AiUsage`          | `aiusages`                        | Audit log of AI feature usage                               | `userId`, `feature` (`career-advisor`/`cover-letter`/`resume`), `targetRole`, `createdAt`                                                                                                                                                                                            |
| `UserReadModel`    | `user` (external, Better Auth)    | Read-only access to Better Auth's user collection           | Schema-less (`strict: false`); read/updated for status, role, and `recruiterStatus` management only                                                                                                                                                                                  |
| `SessionReadModel` | `session` (external, Better Auth) | Read-only access for session cleanup on suspension/deletion | Schema-less                                                                                                                                                                                                                                                                          |
| `AccountReadModel` | `account` (external, Better Auth) | Read-only access for account cleanup on user deletion       | Schema-less                                                                                                                                                                                                                                                                          |

Note: `UserReadModel`, `SessionReadModel`, and `AccountReadModel` intentionally point at collections owned by the external Better Auth system rather than collections created by this server. This server never creates users, sessions, or accounts directly — it only reads and, for status/deletion management, updates them.

## AI Features/Integrations

AI functionality is powered by **Google Gemini** via the `@google/genai` SDK, accessed through a single centralized provider module (`src/modules/ai/provider.ts`) so all AI-dependent features share one client instance and one place to swap providers if needed. The provider exposes two helpers:

- `generateJSON(prompt, schemaHint)` — requests a strict-JSON response (`responseMimeType: "application/json"`), used for structured output.
- `generateText(prompt)` — requests a plain-text response.

If `GEMINI_API_KEY` is not configured, both helpers throw a `500 ApiError`, so AI endpoints fail gracefully without crashing the server.

### Career Advisor (`/api/ai/career-advisor`)

Given a candidate's skills, experience, and target role, the service builds a structured prompt (`career-advisor.prompt.ts`) instructing the model to reason silently and return **only** a JSON object matching a fixed schema, then validates the response against a Zod schema (`career-advisor.validators.ts`). If the first attempt fails validation, the service retries once with an added "strict JSON" reminder before giving up and returning a `502` error. Successful generations are logged to `AiUsage`.

**Context-aware refinement:** before generating, the service pulls the caller's last 3 `AiUsage` records for this feature and folds their `bestMatchingRoles` and `skillGaps` into the prompt as prior context, so repeat requests don't just repeat the same suggestions. The request body also accepts:

- `excludeRoles` (up to 10) — roles to omit from this generation, merged with any roles excluded in prior requests (persisted server-side, so exclusions carry across sessions rather than resetting per call).
- `focusSkill` — an optional skill to weight the advice toward.

Each generation records `bestMatchingRoles`, `skillGaps`, `excludedRoles`, and (if provided) `focusSkill` on the `AiUsage` document, which both drives future context-awareness and backs the history endpoint below.

The generated result includes:

- `careerSummary` — a short fit assessment
- `bestMatchingRoles` — job titles matching current skills
- `skillGaps` — skills to acquire, each with a priority (`High`/`Medium`/`Low`)
- `learningRoadmap` — ordered learning steps
- `salaryInsight` — a salary range and contextual note
- `interviewTips` — actionable interview tips

**History (`GET /api/ai/career-advisor/history`):** returns the caller's last 5 career-advisor requests (`targetRole`, `bestMatchingRoles`, `skillGaps`, `excludedRoles`, `focusSkill`, `createdAt`), letting the frontend surface "previously explored" context alongside a new request.

### Cover Letter Generator (`/api/ai/cover-letter`)

Given a target company/role, optional skills/experience, a tone (`Professional`, `Friendly`, `Enthusiastic`, `Formal`, `Concise`), and a length (`Short`, `Medium`, `Long`), the service builds a plain-text prompt (`cover-letter.prompt.ts`) with explicit opening/closing and word-count guidance. The candidate's name is resolved from the authenticated user's token claim, falling back to their stored `Profile.name` if not present, so the letter is never signed with a placeholder unless no name is available anywhere. Successful generations are logged to `AiUsage`.

### Resume Builder (`/api/ai/resume`)

Given a target role plus optional skills, work experience, education, and achievements, the service builds a plain-text prompt (`resume.prompt.ts`) instructing the model to produce a complete, ATS-friendly resume with fixed section headers (professional summary, skills, work experience, education, and achievements when supplied). As with the cover letter feature, the candidate's name falls back to their stored `Profile.name` when not supplied directly. Successful generations are logged to `AiUsage` under the `resume` feature.

## Validation & Error Handling

- **Validation** is performed with **Zod**. Each module defines schemas for `body`, `params`, and `query` as applicable, and the `validate` middleware (`src/middlewares/validate.middleware.ts`) parses `{ body, params, query }` together, reassigning the parsed (and coerced/defaulted) values back onto the request object. Validation failures produce a `400` response with a `details` array of `{ field, message }` objects.
- **Errors** are represented by a custom `ApiError` class (`statusCode`, `message`, `isOperational`, optional `details`), thrown from services/controllers/middleware and caught centrally.
- **`asyncHandler`** wraps every async controller and middleware function so promise rejections are forwarded to Express's `next()` instead of crashing the process or hanging the request.
- **`notFound` middleware** converts unmatched routes into a `404 ApiError`.
- **`errorHandler` middleware** (registered last) normalizes all errors into the standard JSON error envelope, logs non-operational/unexpected errors to the console, and only exposes internal error messages and stack traces when `NODE_ENV=development`.

## Security Features

- **Helmet** — sets a range of protective HTTP headers on every response.
- **CORS** — restricted to a single configured origin (`CLIENT_URL`) with credentials support, rather than an open/wildcard origin.
- **JWT verification via remote JWKS** — tokens are cryptographically verified against live public keys (`jose.createRemoteJWKSet`), with issuer/audience checks, rather than trusted blindly.
- **Live authorization state** — role and suspension status are re-checked against the database on every request instead of trusted solely from token claims, so revocations take effect immediately.
- **Role-based access control** — enforced via `requireRole` on all admin routes.
- **Resource ownership checks** — enforced via `requireOwnership` (e.g., only a job's creator or an admin can delete it).
- **Rate limiting** — a global limiter (100 req/min) on all `/api` routes, plus a stricter limiter (5 req/15 min) on the public contact form to deter spam/abuse.
- **Input validation everywhere** — all mutating and query endpoints validate input shape, types, and bounds via Zod before reaching business logic; MongoDB `ObjectId` format is explicitly validated where relevant.
- **Regex injection prevention** — user-supplied search strings used to build MongoDB regex filters are escaped before use (`job.service.ts`, `admin.service.ts`).
- **Environment variable validation** — the app refuses to start if required configuration (`DATABASE_URL`, `CLIENT_URL`) is missing or malformed, avoiding insecure default fallbacks.
- **Least-exposure error responses** — stack traces and raw internal error messages are withheld in production responses.
- **Self-action protection** — admins cannot suspend or delete their own account, or change their own recruiter status, through the admin API.
- **Recruiter approval gating** — only recruiters with an `approved` `recruiterStatus` (checked live on every request) may publish jobs or manage applicants; changing a recruiter's status immediately revokes their active sessions, and suspending one also closes their published jobs.
- **Testimonial identity integrity** — testimonial `name`/`role` are always derived server-side from the authenticated user's profile, never accepted directly from the request body, preventing impersonation.

## Deployment Guide

This project is preconfigured for **Vercel** deployment (`vercel.json`):

```json
{
  "version": 2,
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }],
  "rewrites": [{ "source": "/(.*)", "destination": "api/index.ts" }]
}
```

All incoming requests are rewritten to the serverless function at `api/index.ts`, which exports the Express app instance directly (no `app.listen()` — Vercel's Node runtime invokes the exported app as the request handler). The MongoDB connection is established lazily and reused across warm invocations (`connectDB()` in `src/config/db.ts` is idempotent), which is important in a serverless context where the same container can handle multiple invocations.

### Deploying to Vercel

1. Push the repository to a Git provider connected to Vercel (or use the Vercel CLI).
2. In the Vercel project settings, configure the environment variables listed in [Environment Variables](#environment-variables) (`DATABASE_URL`, `CLIENT_URL`, `GEMINI_API_KEY`, and optionally `NODE_ENV=production`).
3. Deploy. Vercel will build and route all traffic through `api/index.ts` per `vercel.json`.
4. Ensure `CLIENT_URL` points to the production Better Auth/client deployment so JWT issuer/audience validation and CORS succeed, and so the JWKS endpoint resolves correctly.

### Deploying elsewhere (traditional Node hosting)

The app is a standard Express server and is not inherently tied to Vercel:

1. `npm install`
2. `npm run build` (compiles to `dist/`)
3. Set the required environment variables in the hosting environment.
4. `npm start` (runs `dist/src/server.js`, which calls `app.listen(PORT)`)
5. Ensure outbound network access to MongoDB, the Better Auth `CLIENT_URL` (for JWKS), and the Gemini API (if AI features are used).

The app is a standard, containerization-agnostic Express server, so it can run just as well behind a Dockerfile, PM2, or any other Node process manager if that's preferred over the steps above.

## Contributing

Contributions are welcome. Please follow the workflow below to keep changes consistent and easy to review.

### Getting started

1. Fork the repository and clone your fork locally.
2. Install dependencies with `npm install` and set up your `.env` file (see [Environment Variables](#environment-variables)).
3. Create a branch off `main` using a descriptive name, e.g. `feat/job-search-filters`, `fix/auth-token-refresh`, `docs/update-readme`.

### Making changes

- Follow the existing modular architecture — each feature lives under `src/modules/<domain>` and follows the `routes` → `controller` → `service` → `model`/`validators` pattern (see [Architecture Overview](#architecture-overview)).
- Keep request validation in `*.validators.ts` (Zod) and business logic in `*.service.ts`; controllers should stay thin.
- Match the existing TypeScript style (strict mode, native ESM, explicit types on exported functions).
- Add or update inline documentation for any new public function, route, or model field.

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) so history and changelogs stay readable, e.g.:

- `feat(jobs): add salary range filter`
- `fix(auth): refresh expired JWKS cache correctly`
- `docs(readme): update deployment instructions`

### Before opening a pull request

1. Run `npm run build` and confirm it completes with no TypeScript errors.
2. Test the affected endpoints locally (via `npm run dev` and a client such as curl, Postman, or the frontend app).
3. Keep pull requests focused — one feature or fix per PR — and describe what changed and why in the PR description.
4. Link any related issue in the PR description.

### Reporting bugs & requesting features

Open a GitHub issue with a clear title and, for bugs, steps to reproduce, expected vs. actual behavior, and relevant logs or request/response payloads.

## License

Licensed under the **MIT License** — see [`LICENSE`](./LICENSE) for the full text. © 2026 Md. Saju Ahmed.
