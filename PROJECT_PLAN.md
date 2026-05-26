# Learner Management System (LMS)
## Project Plan v2.0 — Maximum Acceleration
### 25 May 2026

**Project Owner:** Dr. B.A. Tau
**Plan Version:** 2.0 (Accelerated — 3 Parallel Tracks)
**Start Date:** 25 May 2026
**Pilot Launch Target:** 2 August 2026 (10 weeks)
**Full Multi-School Launch:** October 2026
**Curriculum:** CAPS (IEB-ready later)
**Initial Scope:** Grades 4–9
**Deployment:** Multi-school SaaS — AWS Cape Town (af-south-1)

---

## 1. The Acceleration Model

Instead of building one module at a time, three development tracks run
simultaneously from Week 1. Each track is handled by a dedicated agent
and produces independently testable output.

```
TRACK A — BACKEND   : NestJS APIs, Prisma schema, business logic, DB
TRACK B — FRONTEND  : Next.js pages, UI components, forms, dashboards
TRACK C — DEVOPS    : Repo, CI/CD, AWS infrastructure, environments
```

The only sequential block is the **Assessment Engine** (Weeks 4–5).
The math behind CAPS SBA calculations must be correct before anything
else can be built on top of it.

---

## 2. Timeline Overview (10 Weeks to Pilot)

```
WEEK 1  : Foundation — Schema + Boilerplate + DevOps (all 3 tracks)
WEEK 2  : Core Infrastructure — Auth, Roles, School Onboarding
WEEK 3  : Learner Management — Registration, Student Numbers, Subjects
WEEK 4  : Academic Setup — Timetabling, Attendance (v1)
WEEK 5  : Assessment Engine PART 1 — Architecture + Formative types
WEEK 6  : Assessment Engine PART 2 — SBA engine + Summative + testing
WEEK 7  : Reporting — Report Cards + CAPS Promotion Engine
WEEK 8  : Compliance + Communication — LURITS export + Portals (v1)
WEEK 9  : Finance (v1) + Analytics Dashboard (v1)
WEEK 10 : QA, UAT, Pilot Deployment — 3 schools live
```

**Pilot Launch: Week of 2 August 2026**
**v2 Feature Enhancements: August–October 2026**
**Full Multi-School Launch: October 2026**

---

## 3. Guiding Principles

| Principle | In Practice |
|-----------|------------|
| CAPS-First | Promotion and SBA calculations hard-coded; no manual config |
| SA-SAMS Compatible | One-click LURITS/EMIS export from Day 1 |
| Load-Shedding Resilient | Offline PWA; IndexedDB; background sync |
| Multi-Tenant from Day One | PostgreSQL RLS; school_id on every table |
| POPI Compliant | Data in af-south-1; audit trails; encryption at rest |
| MVP Discipline | Every module built to v1 (pilot-ready) only; v2 post-pilot |
| Parallel Always | Backend + frontend built simultaneously for every module |

---

## 4. CAPS Assessment Weightings (Hard-Coded in Engine)

| Phase | Grades | SBA | Final Exam |
|-------|--------|-----|-----------|
| Intermediate Phase | 4–6 | 75% | 25% |
| Senior Phase | 7–9 | 60% | 40% |
| FET Phase Gr 10–11 | 10–11 | 40% | 60% |
| FET Phase Gr 12 | 12 | 25% | 75% (NSC) |

These are non-negotiable. No school can override them.

---

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Backend | Node.js + NestJS |
| ORM | Prisma |
| Database | PostgreSQL 16 with Row Level Security |
| Multi-Tenancy | Pool model — shared schema, school_id on all tables |
| Cache / Queues | Redis + BullMQ |
| Auth | NextAuth.js (JWT, tenant-aware, subdomain per school) |
| File Storage | AWS S3 |
| Cloud | AWS af-south-1 (Cape Town — POPI compliant) |
| CI/CD | GitHub Actions |
| Mobile (Phase 2) | React Native + Expo |

---

## 6. Module Map

### Tier 1 — MVP (Weeks 1–9)

| # | Module | MVP Scope (v1) | Full Scope (v2) |
|---|--------|---------------|-----------------|
| 1 | School Onboarding & Config | Profile, grades, terms, branding | Multi-branch, fee structures |
| 2 | User Roles & Permissions | 7 roles, RBAC | Custom role builder |
| 3 | Learner Registration | Bio data, guardian, LURITS number | Document uploads, transfers |
| 4 | Student Number Allocation | Auto-generated per school | Custom format config |
| 5 | Subject Choice & Allocation | CAPS catalogue Gr4–9, teacher assign | Gr10–12, IEB catalogue |
| 6 | Timetabling | Manual period grid, basic conflicts | Auto-scheduler, substitutes |
| 7 | Attendance Tracking | Daily register, absence flag | Period-by-period, biometrics |
| 8 | Assessment Engine | All 4 types + CAPS SBA calculator | Rubrics, oral assessments, PAT |
| 9 | Report Cards + Promotion Engine | PDF reports, CAPS promotion logic | Custom templates, digital signatures |
| 10 | SA-SAMS / LURITS Export | Learner + attendance + marks export | Real-time sync |
| 11 | Communication (v1) | Email notifications, absence alerts | SMS, push, two-way chat |
| 12 | Parent + Learner Portal (v1) | Marks, timetable, report cards | Full two-way communication |

### Tier 2 — Growth (Weeks 9–14, post-pilot)

| # | Module |
|---|--------|
| 13 | Fee & Finance Management |
| 14 | Online Payments (PayFast) |
| 15 | Admissions & Enrolment |
| 16 | Examination Management |
| 17 | Analytics Dashboard |

### Tier 3 — Full Platform (Post-launch)

| # | Module |
|---|--------|
| 18 | Staff & HR Management |
| 19 | Discipline & Behaviour Tracking |
| 20 | LSEN / Special Needs (IEP/ISSP) |
| 21 | Library Management |
| 22 | Extracurricular Activities |
| 23 | Transport Management |
| 24 | Inventory & Asset Tracking |
| 25 | PAD Platform Integration |

---

## 7. Phase Detail

---

### WEEK 1 — Foundation
**25 May – 1 June 2026**
**All three tracks start simultaneously.**

#### Track A — Backend
- Design complete PostgreSQL schema: all Tier 1 tables
- Write Prisma schema file with all models
- Define Row Level Security policies for every table
- Seed data: CAPS subject catalogue (Gr4–9), SA provinces, districts
- Define all API endpoints (OpenAPI spec)

#### Track B — Frontend
- Scaffold Next.js 14 project with TypeScript + Tailwind + Shadcn/ui
- Set up app router structure: (auth)/, (dashboard)/, (admin)/
- Build layout system: sidebar, topbar, breadcrumbs
- Build reusable component library: Table, Form, Modal, Badge, Card
- Connect to backend API client (axios/fetch wrapper)

#### Track C — DevOps
- Create GitHub repository (monorepo: /apps/web, /apps/api, /packages/db)
- Set up GitHub Actions: lint → type-check → test → build on every PR
- Configure local dev environment: Docker Compose (postgres + redis)
- Set up staging environment on AWS (af-south-1)
- Configure environment variables management

#### Week 1 Deliverables
- [ ] Complete ERD (Entity-Relationship Diagram) for all Tier 1 modules
- [ ] Prisma schema file with all models and RLS policies
- [ ] GitHub repository live with CI/CD passing
- [ ] Next.js app running locally with layout and component library
- [ ] Docker Compose environment: postgres + redis + api + web all running
- [ ] AWS staging environment provisioned
- [ ] OpenAPI specification for all Tier 1 endpoints

---

### WEEK 2 — Core Infrastructure
**2–8 June 2026**

#### Track A — Backend
- Implement multi-tenant middleware (inject school_id into every request)
- Build authentication: login, logout, refresh token, password reset
- Build RBAC system: permission guards on all endpoints
- Build School Onboarding API (CRUD + validation)
- Build User management API (create, assign role, deactivate)

#### Track B — Frontend
- Build authentication pages: login, password reset, email verification
- Build school onboarding wizard (multi-step form)
- Build super-admin dashboard: school list, usage stats
- Build user management UI: add/edit/deactivate users, assign roles
- Build school settings page: terms, calendar, grade config

#### Week 2 Deliverables
- [ ] Login/logout working end-to-end
- [ ] JWT with school_id claim; RLS verified (school A cannot see school B data)
- [ ] All 7 roles implemented with correct permission matrices
- [ ] School onboarding: create school, configure grades and terms
- [ ] User management: create teacher, assign to school and role

---

### WEEK 3 — Learner Management
**9–15 June 2026**

#### Track A — Backend
- Build Learner Registration API (full CRUD, validation, duplicate detection)
- Build Guardian management API (create, link to learner, multiple guardians)
- Build Student Number allocation engine (auto-generate, duplicate check)
- Build CAPS Subject catalogue API (Gr4–9 subjects pre-seeded)
- Build Subject allocation API (assign subject to class and teacher)

#### Track B — Frontend
- Build learner registration form (all CAPS biographical fields)
- Build guardian management UI (add/link/edit guardians)
- Build learner profile page (all data in one view, edit inline)
- Build learner list page (search, filter by grade/class, bulk actions)
- Build CSV import wizard (bulk learner upload with validation preview)
- Build subject catalogue and allocation UI

#### Week 3 Deliverables
- [ ] Full learner registration end-to-end (register learner, link guardian)
- [ ] Student number auto-generated on registration
- [ ] Learner search and filter working
- [ ] CSV bulk import (test with 200 learners)
- [ ] CAPS subjects Gr4–9 allocated to classes and teachers

---

### WEEK 4 — Academic Setup
**16–22 June 2026**

#### Track A — Backend
- Build Timetable API (period grid, class-subject-teacher-venue links)
- Build conflict detection engine (teacher double-booking, venue clashes)
- Build Attendance API (daily register capture, absent/present/late)
- Build absence flag logic (trigger notification placeholder)

#### Track B — Frontend
- Build timetable grid builder (drag-and-drop period assignment)
- Build timetable views: per class, per teacher, per venue
- Build timetable PDF export
- Build attendance capture UI (teacher view: mark register by class)
- Build attendance history per learner
- Build attendance summary per class and term

#### Week 4 Deliverables
- [ ] Timetable builder: periods configured, subjects/teachers assigned
- [ ] Basic conflict detection (flags clashes, does not auto-resolve)
- [ ] Timetable export to PDF per class and per teacher
- [ ] Attendance register: teacher captures daily register in < 2 minutes
- [ ] Attendance summary visible on learner profile

---

### WEEKS 5–6 — Assessment Engine
**23 June – 6 July 2026**
**BOTH TRACKS FOCUSED. THIS IS THE CRITICAL PATH.**

No parallelism shortcuts here. Both backend and frontend must be
built, tested, and verified against real CAPS scenarios before
proceeding. One calculation error = wrong report cards.

#### Week 5 — Architecture + Formative Assessment

##### Track A — Backend
- Design assessment data model: Task, Mark, MarkBook, ProgrammeOfAssessment
- Build assessment task creation API (configurable: type, weight, max mark, term)
- Build mark capture API with validation (range checks, missing mark flags)
- Build Diagnostic Assessment module (baseline + knowledge gap identification)
- Build Learning Profile module (strengths, weaknesses, LSEN flags)
- Build Formative Assessment API: Class Test, Assignment, Homework

##### Track B — Frontend
- Build Programme of Assessment builder (configure tasks per subject per term)
- Build mark capture UI: teacher mark book (grid view, inline editing)
- Build diagnostic assessment capture form
- Build learning profile record (per learner, editable by teacher)
- Build formative assessment UI (create task, capture marks, view results)

#### Week 6 — SBA Engine + Summative + Full Testing

##### Track A — Backend
- Build Summative Assessment API (year-end / November exam mark capture)
- Build SBA Calculation Engine:
  - Phase-aware weighting (Gr4-6: 75/25, Gr7-9: 60/40, Gr10-11: 40/60)
  - Term SBA aggregation per subject per learner
  - Final mark = weighted(SBA average) + weighted(exam mark)
- Build moderation workflow (HOD reviews and approves mark submissions)
- Write comprehensive unit tests for ALL calculation scenarios:
  - All phase combinations (Gr4, Gr5, Gr6, Gr7, Gr8, Gr9)
  - Edge cases: absent for exam, partial SBA completion, borderline marks

##### Track B — Frontend
- Build summative assessment capture UI
- Build SBA summary view per learner (term-by-term breakdown)
- Build moderation dashboard (HOD view: pending submissions, sign-off)
- Build assessment analytics: class average, mark distribution chart
- Build mark export (Excel per subject, PDF per learner)

#### Weeks 5–6 Deliverables
- [ ] All 4 assessment types capturing marks end-to-end
- [ ] SBA calculator verified against manual calculations for all 6 grades
- [ ] 100% of unit tests passing for all calculation scenarios
- [ ] Moderation workflow: HOD can approve/reject submitted marks
- [ ] Mark export working (Excel + PDF)

---

### WEEK 7 — Report Cards + Promotion Engine
**7–13 July 2026**

#### Track A — Backend
- Build Report Card generation engine (aggregate marks per learner per subject)
- Build Promotion Engine with hard-coded CAPS criteria:
  - Intermediate Phase (Gr4-6): 50% HL, 40% FAL, 40% Maths, 40% NS&T, 40% SS
  - Senior Phase (Gr7-9): 50% HL, 40% FAL, 40% Maths, 40% in 3 others, 30% rest
  - FET Phase (Gr10-11): 40% HL, 40% in 2 others, 30% in 3 others
- Build progression rules (max 2 years per grade in phase)
- Build at-risk learner flagging (mid-term trajectory analysis)
- Build override workflow (principal override with audit log)

#### Track B — Frontend
- Build report card template (Intermediate Phase layout)
- Build report card template (Senior Phase layout)
- Build PDF generation (individual and bulk per class/grade)
- Build promotion decision view (per class: PROMOTE / REPEAT / PROGRESS)
- Build at-risk learner panel (HOD/principal view)
- Build override UI (record reason, log to audit trail)

#### Week 7 Deliverables
- [ ] Term report cards generated correctly for all Gr4–9 scenarios
- [ ] Annual report card with correct final mark (SBA + exam weighted)
- [ ] Promotion engine tested against all CAPS scenarios
- [ ] Progression rules enforced (cannot flag same grade repeat 3x)
- [ ] PDF bulk download: full school report cards in one click
- [ ] At-risk flags visible to HOD 4 weeks before term end

---

### WEEK 8 — Compliance + Communication + Portals
**14–20 July 2026**

#### Track A — Backend
- Build LURITS export: learner biographical data in correct format
- Build EMIS export: annual survey data package
- Build export validation engine (flag missing required fields)
- Build export history and audit log
- Build email notification service (SendGrid / AWS SES integration)
- Build parent/learner/teacher portal data APIs
  (filtered views: marks, timetable, attendance, report cards)

#### Track B — Frontend
- Build LURITS export UI (validate → export → download)
- Build export history page
- Build parent portal: marks, attendance, timetable, report cards
- Build learner portal: timetable, assignments, marks
- Build teacher portal: mark book, attendance register, class list
- Build email notification templates (absence alert, report card ready)

#### Week 8 Deliverables
- [ ] LURITS export produces valid output (validated against SA-SAMS spec)
- [ ] EMIS export package complete
- [ ] Parent portal: parent can log in and see child's full academic record
- [ ] Learner portal: learner can view timetable and marks
- [ ] Email: absence alert sent automatically when register captured
- [ ] Email: report card notification sent on publication

---

### WEEK 9 — Finance (v1) + Analytics
**21–27 July 2026**

#### Track A — Backend
- Build fee structure API (configure tuition, registration, activity fees)
- Build invoice generation engine (per learner, per term)
- Build payment recording API (manual payment capture for v1)
- Build outstanding debtors query
- Build analytics aggregation queries:
  - Pass rate per grade, per subject, per term
  - Attendance rate per class and school
  - At-risk learner count per grade
  - Subject performance distribution

#### Track B — Frontend
- Build fee structure configuration UI
- Build invoice list per learner and bulk per grade
- Build payment recording UI (record payment, generate receipt)
- Build outstanding fees report (sortable, exportable)
- Build principal analytics dashboard:
  - School-wide pass rate card
  - At-risk learner count
  - Attendance trend (7-day rolling)
  - Subject performance table
- Build HOD dashboard: subject performance per class

#### Week 9 Deliverables
- [ ] Fee invoices generated per learner
- [ ] Payment recording and receipt generation
- [ ] Outstanding debtors report (export to Excel)
- [ ] Principal dashboard: key metrics visible at a glance
- [ ] HOD dashboard: subject performance and at-risk count per class

---

### WEEK 10 — QA, UAT and Pilot Launch
**28 July – 3 August 2026**

#### Testing Activities
- [ ] End-to-end integration tests: full learner journey from registration to report card
- [ ] Cross-tenant isolation test: school A cannot access school B data
- [ ] Load test: 10 schools, 500 learners each, concurrent mark capture
- [ ] LURITS export validation: feed output into SA-SAMS test environment
- [ ] PDF generation stress test: 500 report cards simultaneously
- [ ] Security audit: POPI compliance check, auth bypass attempts
- [ ] Mobile responsiveness check (parent portal on phone)

#### UAT with Pilot Schools
- [ ] Run guided UAT with 2–3 school administrators (Hartrog Academy first)
- [ ] Run guided UAT with 2–3 teachers (mark capture + report cards)
- [ ] Run guided UAT with 2–3 parents (portal access)
- [ ] Collect structured feedback, fix critical issues

#### Pilot Deployment
- [ ] Deploy to AWS af-south-1 production environment
- [ ] Configure custom subdomains (hartrog.lms.co.za etc.)
- [ ] Data migration: import existing learner data from pilot schools
- [ ] Create admin accounts for school staff
- [ ] Conduct 2-hour onboarding session per pilot school
- [ ] Open WhatsApp support channel with pilot schools

**PILOT LAUNCH TARGET: 2 August 2026**

---

## 8. Post-Pilot Roadmap (August–October 2026)

### August 2026 — v2 Enhancements (based on pilot feedback)
- Period-by-period attendance
- SMS gateway integration (BulkSMS / Clickatell)
- Timetable auto-conflict resolver
- Payment gateway (PayFast integration)
- Custom report card templates per school

### September 2026 — Tier 2 Modules
- Full Admissions & Enrolment module
- Examination Management module
- Advanced Analytics (year-on-year comparisons)
- Grades 10–12 CAPS subject catalogue + combination validator

### October 2026 — Full Multi-School Launch
- Self-service school onboarding
- Marketing website
- Pricing model (per-learner-per-month)
- Partner / referral programme
- Begin PAD platform integration design

---

## 9. Risk Register

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | Assessment calculation error | 100% unit test coverage; manual verification against paper calculations |
| 2 | SA-SAMS export format mismatch | Test export against actual SA-SAMS import in staging before pilot |
| 3 | Load-shedding disrupts pilot | Offline PWA with local storage; built in Week 1 boilerplate |
| 4 | Cross-tenant data leak | PostgreSQL RLS tested end-to-end in Week 2; penetration tested in Week 10 |
| 5 | POPI non-compliance | AWS af-south-1; encryption at rest and in transit; audit logs from Day 1 |
| 6 | Scope creep delays pilot | Strict v1/v2 split; all enhancement requests go to post-pilot backlog |
| 7 | Integration bugs between tracks | Daily sync between backend and frontend agents; shared OpenAPI spec |

---

## 10. Success Metrics

### By Pilot Launch (2 August 2026)
- 3 schools onboarded and live
- Report cards generated correctly for at least one full term of data
- LURITS export accepted by SA-SAMS without errors
- Zero cross-tenant data access incidents

### 30 Days Post-Pilot (September 2026)
- Net Promoter Score > 40 from school administrators
- Teachers capture mark registers in under 3 minutes per class
- Report card generation < 30 seconds for 200 learners
- At least one school has stopped double-capturing in SA-SAMS

### Full Launch (October 2026)
- 10+ schools on the platform
- Self-service onboarding working (school signs up without manual help)
- Platform stable under 50 concurrent schools

---

## 11. Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 25 May 2026 | Initial plan — 26 weeks sequential |
| 1.5 | 25 May 2026 | Revised — 14 weeks with some parallelism |
| 2.0 | 25 May 2026 | Maximum acceleration — 10 weeks, 3 parallel tracks |

---

*Document v2.0 | 25 May 2026 | Dr. B.A. Tau / Claude Code*
*Next action: Begin Phase 0, Week 1 — Full database schema design*
