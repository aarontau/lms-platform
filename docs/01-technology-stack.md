# 01 — Technology Stack

Every technology in this platform was chosen deliberately. This document explains what each
one is, what job it does, and why it was chosen over the alternatives. If you are replicating
this for a new school, you can use exactly the same stack — or use this document to make an
informed substitution if your context requires it.

---

## The Stack at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  Browser (learner / teacher / principal)                 │
│                                                          │
│  Next.js 14  ←  TypeScript  ←  Tailwind CSS             │
│  React Query · NextAuth · Lucide Icons                   │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP / REST
┌────────────────────────▼────────────────────────────────┐
│  NestJS API  (Node.js · TypeScript · JWT)                │
│  Prisma ORM                                              │
└────────────────────────┬────────────────────────────────┘
                         │  SQL
┌────────────────────────▼────────────────────────────────┐
│  PostgreSQL Database                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend

### Next.js 14 (App Router)
**What it is:** A React framework that handles routing, page rendering, and project structure.  
**Why it was chosen:** Next.js uses a folder-based routing system — you create a folder and a
`page.tsx` file inside it and that becomes a URL. This makes the codebase readable even to
non-developers. It also handles code splitting (only loading what is needed for each page)
automatically. The App Router introduced in version 13 groups related pages together using
`(folder)` syntax, which is how the dashboard layout wraps every authenticated page without
repeating the sidebar code.

**The alternative we did not use:** Create React App — simpler but no routing, no server
rendering, less structure for large projects.

---

### TypeScript
**What it is:** JavaScript with types. You declare what shape your data has, and the editor
tells you immediately when something does not match.  
**Why it was chosen:** The platform handles sensitive learner data. A type error caught by
the editor before the code runs is infinitely better than a crash in production. TypeScript
also makes the codebase self-documenting — when you look at a function, you can see exactly
what it expects and what it returns without reading all the code.

---

### Tailwind CSS
**What it is:** A CSS framework where you style elements by adding class names directly in
your HTML/JSX, rather than writing separate CSS files.  
**Why it was chosen:** Speed and consistency. Every colour, spacing value, border radius and
shadow in the platform comes from Tailwind's predefined scale, which means every page looks
consistent without a designer enforcing it. The `primary-600`, `primary-700` etc. colour
scale is defined once in `tailwind.config.ts` and used everywhere — changing the brand colour
for a new school is a single-line edit.

**Key customisation point for new schools:** `apps/web/tailwind.config.ts` — the `primary`
colour palette.

---

### TanStack Query (React Query)
**What it is:** A library for fetching, caching and synchronising server data in React.  
**Why it was chosen:** Without it, every page would need to manually manage loading states,
error states, re-fetching, and caching. React Query does all of that with two lines:
`useQuery` to fetch, `useMutation` to write. It also means that when a teacher updates a
learner's record, every other component showing that learner's data refreshes automatically.

---

### NextAuth.js
**What it is:** Authentication for Next.js applications.  
**Why it was chosen:** Authentication is the part of any web application most likely to have
security vulnerabilities if built from scratch. NextAuth handles sessions, JWT tokens,
credential validation, and callback URLs in a way that is battle-tested. It also integrates
directly with Next.js middleware, meaning unauthenticated users are redirected before any
page even loads.

---

### Lucide React
**What it is:** An icon library — over 1 000 clean, consistent SVG icons as React components.  
**Why it was chosen:** Consistency. Every icon across every page comes from the same set,
same stroke width, same visual weight. You import the icon by name and use it like any
component: `<Printer className="h-4 w-4" />`. There is no need to manage image files for icons.

---

## Backend

### NestJS
**What it is:** A framework for building server-side applications in Node.js, using TypeScript.  
**Why it was chosen:** NestJS enforces a structured approach — Controllers handle HTTP
requests, Services contain business logic, Modules organise everything. This structure means
that a developer picking up the project for the first time can immediately find where any
piece of logic lives. It also has built-in support for Guards (which enforce role-based access:
only a PRINCIPAL can see the HR data), Interceptors, and Pipes (which validate incoming data).

**The alternative we did not use:** Express.js — more flexible but no structure, which becomes
a maintenance problem as the project grows.

---

### Prisma ORM
**What it is:** A tool that lets you define your database structure in a single schema file
(`schema.prisma`) and then interact with the database using TypeScript instead of raw SQL.  
**Why it was chosen:** Three reasons. First, the schema file is the single source of truth
for the entire database structure — readable by anyone, not buried in SQL migration files.
Second, Prisma generates TypeScript types from the schema, so the database and the code are
always in sync. Third, Prisma's migration system (`prisma migrate dev`) tracks every change
to the database structure over time, making it safe to evolve the schema without losing data.

---

## Database

### PostgreSQL
**What it is:** A powerful, open-source relational database.  
**Why it was chosen:** Relational databases are the right choice for structured, related data
like learners, classes, grades, enrolments, assessments and results — where the relationships
between records matter and need to be enforced. PostgreSQL is the most capable open-source
option, with excellent support from every hosting provider, and Prisma supports it natively.

**The alternative we did not use:** MongoDB — document databases are good for unstructured
data but a poor fit for highly relational educational data where a learner must belong to a
class which belongs to a grade which belongs to a school and an academic year.

---

## Project Organisation

The project is a **monorepo** — one repository containing both the frontend and the backend.

```
LMS Project/
├── apps/
│   ├── web/          ← Next.js frontend (what users see in the browser)
│   └── api/          ← NestJS backend (business logic and database access)
├── docs/             ← This documentation
└── package.json      ← Root workspace configuration
```

**Why a monorepo?** Because the frontend and backend share TypeScript type definitions.
When the API returns a `Learner` object, the frontend knows exactly what fields it contains
because they share the same type. This eliminates an entire category of bugs.

---

## Summary Table

| Technology | Role | Replaceability |
|-----------|------|----------------|
| Next.js | Frontend framework | High — any React framework works |
| TypeScript | Type safety | Low — removing it creates technical debt |
| Tailwind CSS | Styling | High — can use CSS Modules, Styled Components |
| TanStack Query | Data fetching | Medium — SWR is a good alternative |
| NextAuth | Authentication | Medium — Auth.js, Clerk, Supabase Auth |
| Lucide React | Icons | High — any icon library |
| NestJS | API framework | High — Express, Fastify, Hono |
| Prisma | Database ORM | Medium — DrizzleORM is modern alternative |
| PostgreSQL | Database | Medium — MySQL works; MongoDB does not |
