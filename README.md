# EduTrack LMS

**South African Multi-School Learner Management System**

A CAPS-native, multi-tenant SaaS platform for South African schools — built to replace the double-capture burden of SA-SAMS with a modern, load-shedding-resilient system that schools actually want to use.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Backend | Node.js + NestJS |
| ORM | Prisma |
| Database | PostgreSQL 16 (Row Level Security) |
| Cache / Queues | Redis + BullMQ |
| Auth | NextAuth.js (JWT, multi-tenant) |
| File Storage | AWS S3 (af-south-1) |
| Cloud | AWS Cape Town — POPI compliant |

---

## Project Structure

```
edutrack-lms/
├── apps/
│   ├── web/          # Next.js 14 frontend (admin + portals)
│   └── api/          # NestJS backend (REST API)
├── packages/
│   └── db/           # Shared Prisma schema + migrations
├── docker/           # Docker Compose for local development
└── .github/          # CI/CD workflows
```

---

## Prerequisites

- Node.js 20+
- Docker Desktop
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/edutrack-lms.git
cd edutrack-lms

# 2. Install dependencies
npm install

# 3. Start database and Redis
docker-compose -f docker/docker-compose.yml up -d

# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 5. Run database migrations
cd packages/db
npx prisma migrate dev

# 6. Seed the database (CAPS subjects, provinces, phases)
npx prisma db seed

# 7. Start development servers
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api

---

## Modules

### Tier 1 — MVP
1. School Onboarding & Configuration
2. User Roles & Permissions
3. Learner Registration
4. Student Number Allocation
5. Subject Choice & Allocation (CAPS Gr4–9)
6. Timetabling
7. Attendance Tracking
8. Assessment Engine (Diagnostic, Learning Profile, Formative, Summative)
9. Report Cards + CAPS Promotion Engine
10. SA-SAMS / LURITS Export

### Tier 2 — Growth
11. Communication (SMS, email, push notifications)
12. Parent & Learner Portal
13. Fee & Finance Management
14. Online Payments (PayFast)
15. Admissions & Enrolment
16. Examination Management
17. Analytics Dashboard

---

## Architecture

**Multi-Tenancy:** PostgreSQL Row Level Security with `school_id` on every tenant table. Each school's data is completely isolated at the database level.

**CAPS-Native:** Assessment weightings, promotion criteria, and progression rules are hard-coded per CAPS phase — not manually configured.

| Phase | Grades | SBA | Exam |
|-------|--------|-----|------|
| Intermediate | 4–6 | 75% | 25% |
| Senior | 7–9 | 60% | 40% |
| FET Gr10–11 | 10–11 | 40% | 60% |
| FET Gr12 | 12 | 25% | 75% |

**Load-Shedding Resilience:** PWA with offline caching. Teachers can capture attendance and marks without internet — data syncs on reconnect.

**SA-SAMS Compatible:** One-click LURITS/EMIS export removes the double-capture burden for SA public schools.

---

## Documentation

- [Project Plan](PROJECT_PLAN.md) — 10-week build plan to pilot launch
- [Database Design](DATABASE_DESIGN.md) — ERD, RLS policies, calculation logic

---

## Pilot Launch

**Target:** 2 August 2026 — 3 pilot schools including Hartrog Academy

---

*Built with Claude Code | Dr. B.A. Tau | 2026*
