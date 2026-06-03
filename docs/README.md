# Platform Documentation Index

> **Project:** UL-Junior Project — School Management Platform  
> **Partners:** University of Limpopo × Mopani West Education District (MWED)  
> **Built:** 2026  
> **Stack:** Next.js · NestJS · PostgreSQL · Prisma · TypeScript

---

This documentation exists so that the platform can be replicated for any school or district
without starting from scratch. Everything that was decided, why it was decided, and how it
was built is recorded here.

---

## Documents in This Folder

| File | What It Covers |
|------|---------------|
| [01-technology-stack.md](./01-technology-stack.md) | Every technology used and the reason it was chosen |
| [02-architecture.md](./02-architecture.md) | How the system is structured and how the pieces talk to each other |
| [03-database-schema.md](./03-database-schema.md) | The data model — every table, what it holds, and how tables relate |
| [04-features.md](./04-features.md) | Every feature/module: what it does, where it lives, how it works |
| [05-ui-patterns.md](./05-ui-patterns.md) | How the frontend is built — layout, components, forms, print, colour |
| [06-new-school-setup.md](./06-new-school-setup.md) | Step-by-step guide to deploying this for a brand new school |
| [07-deployment.md](./07-deployment.md) | Taking the platform from local machine to public internet |

---

## Quick Facts

- **Who uses it:** Principals, HODs, Teachers (staff-facing for now; learner portal planned)
- **Grades covered:** Grade 8 and Grade 9 (infrastructure supports Grade 4–9)
- **Learners:** 1 053 across three centres (BuPhe, MaPhu, Kgapane)
- **Languages:** English interface; content can be adapted
- **Compliance:** Designed with POPIA (South African data protection law) in mind

---

## The Core Idea

Every decision in this platform was made to answer one question:

> *Which learner needs help, of what kind, and how urgently?*

The Diagnostic Assessment establishes a baseline. The screeners identify learning barriers.
Attendance flags disengagement. Assessment tracks progress. Report cards communicate to parents.
HR and Finance keep the operation running. Everything feeds into a single picture of each learner.

That is the thread running through every feature.
