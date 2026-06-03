# 02 — System Architecture

This document explains how the pieces of the platform fit together and talk to each other.
Understanding the architecture makes it possible to add new features, fix problems, and
replicate the system without guessing.

---

## The Two Applications

The platform has two separate applications that work together:

```
┌──────────────────────┐         ┌──────────────────────┐
│   apps/web           │         │   apps/api           │
│   (Frontend)         │──REST──▶│   (Backend)          │
│   Port 3000          │◀────────│   Port 4000          │
│   Next.js            │  JSON   │   NestJS             │
└──────────────────────┘         └──────────┬───────────┘
                                            │ SQL
                                 ┌──────────▼───────────┐
                                 │   PostgreSQL         │
                                 │   (Database)         │
                                 └──────────────────────┘
```

The browser never talks directly to the database. It always goes through the API.
The API is the gatekeeper — it validates who the user is, what role they have, and
whether they are allowed to perform the requested action.

---

## Authentication Flow

When a user logs in:

```
1. User enters email + password on /login page
2. NextAuth sends credentials to the NestJS API (/auth/login)
3. API checks the email exists, verifies the password hash (bcrypt)
4. API returns a JWT (JSON Web Token) containing the user's id, role, schoolId
5. NextAuth stores this as an encrypted session cookie in the browser
6. Every subsequent API request includes this token in the Authorization header
7. NestJS Guards verify the token and extract the user on every request
8. If the token is invalid or missing → 401 Unauthorized → redirect to /login
```

The JWT contains: `userId`, `email`, `role`, `schoolId`, `firstName`, `lastName`.
This means the API never needs to query the database just to know who is making a request.

---

## Role-Based Access Control

Every API endpoint is decorated with `@Roles(...)` — a list of roles that are allowed to
call it. The `RolesGuard` checks the logged-in user's role against this list before
the request reaches the controller.

```typescript
// Example: Only these roles can list learners
@Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
@Get('/learners')
findAll() { ... }
```

The roles in order of access level:

| Role | Access Level | Typical User |
|------|-------------|--------------|
| `SUPER_ADMIN` | Everything, all schools | Platform administrator |
| `SCHOOL_ADMIN` | Everything within one school | District IT admin |
| `PRINCIPAL` | All data + locked sections (screeners, HR, finance) | School principal |
| `HOD` | Academic data for their department | Head of Department |
| `TEACHER` | Learner data, attendance, assessment for their classes | Class teacher |
| `PARENT` | Own child's data only | Parent / guardian |
| `LEARNER` | Own data only (future) | Learner |

On the **frontend**, the sidebar filters navigation items based on the logged-in user's role.
Items marked `principalOnly: true` are hidden from teachers and HODs.

---

## The Backend Module Structure

Every feature in the backend is a NestJS **module**. Each module contains:

```
src/modules/
├── auth/           ← Login, JWT, session
├── users/          ← User accounts (staff)
├── schools/        ← School records
├── grades/         ← Grade 8, Grade 9, etc.
├── classes/        ← BuPhe-8A, MaPhu-9D, etc.
├── learners/       ← Learner profiles and enrolments
├── subjects/       ← Mathematics, Science, etc.
├── attendance/     ← Daily attendance registers
├── assessment/     ← Programme of Assessment (POA)
├── screening/      ← Dyslexia and ADHD screeners
├── analytics/      ← Aggregated statistics
├── communications/ ← Notices and messages
├── finance/        ← Fee structures and payments
└── hr/             ← Staff recruitment and records
```

Each module has three files:
- `[name].module.ts` — wires everything together
- `[name].controller.ts` — defines the HTTP routes (GET, POST, PUT, DELETE)
- `[name].service.ts` — contains the actual business logic and database queries

---

## The Frontend Route Structure

The Next.js App Router maps folders to URLs:

```
src/app/
├── (auth)/
│   └── login/page.tsx          → /login
└── (dashboard)/                ← Shared layout (sidebar + topbar)
    ├── layout.tsx              ← Sidebar + TopBar rendered here
    ├── dashboard/page.tsx      → /dashboard
    ├── learners/
    │   ├── page.tsx            → /learners
    │   └── [id]/page.tsx       → /learners/abc-123
    ├── assessment/
    │   ├── page.tsx            → /assessment
    │   ├── diagnostic/
    │   │   ├── page.tsx        → /assessment/diagnostic
    │   │   └── [subject]/[grade]/page.tsx → /assessment/diagnostic/mathematics/8
    │   └── poa/[id]/page.tsx   → /assessment/poa/abc-123
    ├── screening/page.tsx      → /screening
    ├── classlists/page.tsx     → /classlists
    ├── hr/page.tsx             → /hr
    └── ...
```

The `(dashboard)` folder with parentheses is a **route group** — it groups pages that share
a layout (the sidebar and topbar) without affecting the URL. The user never sees `(dashboard)`
in their address bar.

---

## How a Page Fetches Data

Every page follows the same pattern:

```typescript
// 1. Get the logged-in user's session
const { data: session } = useSession()

// 2. Declare what data you need (React Query handles fetching, caching, re-fetching)
const { data: learners, isLoading } = useQuery({
  queryKey: ['learners', filters],
  queryFn:  () => learnersApi.getAll(filters),
})

// 3. Show loading state while data arrives
if (isLoading) return <Spinner />

// 4. Render the data
return <LearnerTable learners={learners} />
```

The `learnersApi` object (in `src/lib/api.ts`) is a thin wrapper around `fetch` that:
- Adds the Authorization header automatically
- Points to the correct API URL (from environment variables)
- Returns typed data

---

## How a Write (Create / Update / Delete) Works

```typescript
const mutation = useMutation({
  mutationFn: (data) => learnersApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['learners'] })  // refresh the list
    toast.success('Learner created')
    closeModal()
  },
  onError: (err) => toast.error(err.message),
})

// Triggered by form submit:
mutation.mutate(formData)
```

---

## Data Ownership and Multi-School Isolation

Every record in the database has a `schoolId` field. The API reads the `schoolId` from the
logged-in user's JWT and automatically filters all queries to that school. A teacher at
School A can never see data from School B — not because of frontend filtering, but because
the API query always includes `WHERE school_id = $schoolId`.

This is the mechanism that makes the platform multi-tenant (usable by multiple schools)
without a separate database per school.

---

## Environment Variables

The platform uses environment variables to separate configuration from code.
This is what allows the same codebase to run locally and in production with different
settings, and to be customised for a new school without changing any code.

**Frontend (`apps/web/.env.local`):**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-string>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend (`apps/api/.env`):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/lms
JWT_SECRET=<random-string>
JWT_EXPIRY=7d
```

For a new school deployment, only the `DATABASE_URL` and the URL variables change.
Everything else stays the same.
