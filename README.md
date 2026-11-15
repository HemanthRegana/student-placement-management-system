# Student Placement Management System (SPMS)

A full-stack campus recruitment platform built with **Next.js 14, TypeScript, Tailwind CSS, MongoDB, Mongoose and JWT sessions**.

## Core capabilities

- Student self-registration and sign-in with hashed passwords.
- Role-aware portals for students, placement officers and company users.
- Placement drive creation API with eligibility criteria (CGPA, backlogs, department and graduation year).
- Student opportunity browsing and application submission.
- Duplicate application prevention and application status tracking.
- Placement office student directory and dashboard metrics.
- SPM documentation: SRS, work breakdown, schedule, risk register, UML, test cases and deployment guide.

## Quick start

### Requirements

- Node.js 20 LTS or newer
- npm
- MongoDB Atlas cluster or local MongoDB instance

### Install

```bash
npm install
cp .env.example .env.local
```

Set `MONGODB_URI` and a strong random `JWT_SECRET` in `.env.local`.

```bash
npm run dev
```

Open http://localhost:3000.

### First placement officer / company account

Public registration deliberately creates **student-only** accounts. This prevents a visitor from granting themselves privileged access. Create the first officer account using the one-time script below after setting environment variables:

```bash
npm run create-officer -- --name "Placement Officer" --email officer@college.edu
```

The script prompts for a password. Keep the credentials private. Company accounts should be created by an authorized officer in a future admin workflow; the current POST `/api/jobs` endpoint permits authenticated `OFFICER` and `COMPANY` roles.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/register` | Student registration |
| `/login` | Sign in |
| `/dashboard` | Role-aware overview |
| `/dashboard/jobs` | Browse placement drives and apply |
| `/dashboard/applications` | Track applications |
| `/dashboard/students` | Officer-only student directory |
| `GET /api/jobs` | List active placement drives |
| `POST /api/jobs` | Create a placement drive (OFFICER / COMPANY) |
| `GET /api/applications` | List current user's applications; officers see all |
| `POST /api/applications` | Apply to a drive (STUDENT) |

## Important implementation notes

- Never commit `.env.local`, database credentials, JWT secrets or real student data.
- Set a unique, high-entropy `JWT_SECRET` in production.
- Restrict officer/company account provisioning to verified institutional administrators.
- Add institutional privacy notice, retention policy, backups and audit logging before real-world deployment.
- Resume upload, email notifications, interview scheduling, offer-letter storage, CSV export and full admin CRUD are planned extensions, not yet implemented.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for GitHub and Vercel setup.

## Academic documentation

See [`docs/`](docs/) for the SPM deliverables.
