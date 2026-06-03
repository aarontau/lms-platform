# 03 — Database Schema

The database is the heart of the platform. This document describes every major table,
what data it holds, and how tables relate to each other. Understanding this is essential
for replicating or extending the platform.

The full schema lives at: `apps/api/prisma/schema.prisma`

---

## The Entity Map

```
School
  ├── AcademicYear
  ├── CapsPhase
  ├── Grade (8, 9, ...)
  │     └── Class (BuPhe-8A, MaPhu-9D, ...)
  │           └── LearnerEnrolment ──▶ Learner
  ├── User (staff accounts)
  ├── Subject
  │     └── SubjectClass (subject linked to a specific class)
  ├── AttendanceRegister
  │     └── AttendanceEntry ──▶ Learner
  ├── Assessment (POA)
  │     └── AssessmentTask
  ├── ScreeningRecord ──▶ Learner
  ├── FeeStructure
  └── Communication
```

---

## Core Tables

### School
The top-level record. Every other record belongs to a school via `schoolId`.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | Unique identifier |
| name | String | School display name (e.g. "MWED-BUPHEPHUKGAMA") |
| code | String | Short code for the school |
| province | String | |
| district | String | |
| phase | String | Primary, Secondary, etc. |
| address | String | |

**Key principle:** Every other table has a `schoolId` field. The API always filters by
`schoolId` from the logged-in user's token, ensuring complete data isolation between schools.

---

### AcademicYear
Represents a school year. All grades, classes, enrolments, and assessments belong to an
academic year so that historical data is preserved when a new year starts.

| Field | Type | Purpose |
|-------|------|---------|
| id | String | e.g. `year-2026-hartrog` |
| schoolId | String | |
| year | Int | 2026 |
| isActive | Boolean | Only one year is active at a time |

---

### Grade
Represents a grade level within a school and year.

| Field | Type | Purpose |
|-------|------|---------|
| id | String | e.g. `grade-8-hartrog` |
| schoolId | String | |
| gradeNumber | Int | 8, 9, etc. |
| name | String | "Grade 8" |
| academicYearId | String | |
| capsPhaseId | String | Links to the CAPS phase |

---

### Class
A specific class group within a grade. This is what learners are actually assigned to.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | |
| schoolId | String | |
| gradeId | String | |
| academicYearId | String | |
| name | String | "BuPhe-8A", "Kgapane-9D", etc. |
| maxCapacity | Int | Default 35 |
| classTeacherId | String? | Optional link to a User |

**Naming convention used in this project:**
- `BuPhe-8A` through `BuPhe-8D` — Burgersdorp + Pherehla-Maake centre, Grade 8
- `MaPhu-8A` through `MaPhu-8D` — Mafutsane + Phusela centre, Grade 8
- `Kgapane-8A` through `Kgapane-8D` — Kgapane centre, Grade 8
- Same pattern for Grade 9

---

### Learner
The learner's biographical record. Does NOT change year to year — a learner is a learner
across multiple academic years. What changes is their **enrolment** (which class, which grade,
which year).

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | |
| schoolId | String | |
| studentNumber | String | Unique per school |
| firstName | String | |
| lastName | String | |
| middleName | String? | |
| dateOfBirth | DateTime | |
| gender | Enum | MALE, FEMALE |
| nationality | String | |
| homeLanguage | String | |
| idNumber | String? | SA ID or passport |
| status | Enum | ACTIVE, INACTIVE, TRANSFERRED, GRADUATED |
| hasSpecialNeeds | Boolean | |
| medicalNotes | String? | |

---

### LearnerEnrolment
The JOIN between a Learner and a Class for a specific year. This is what you update
when you move a learner between classes or years.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | |
| learnerId | String | |
| schoolId | String | |
| academicYearId | String | |
| gradeId | String | |
| classId | String | ← This is what was updated in the bulk redistribution |
| enrolmentDate | DateTime | |
| status | Enum | ACTIVE, INACTIVE, TRANSFERRED |
| isRepeating | Boolean | |

**Important:** To move a learner to a different class, update `classId` on their active
`LearnerEnrolment` record. The Learner record itself does not change.

---

### User
Staff accounts. Separate from Learner records because staff and learners have very different
data needs.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | |
| schoolId | String | |
| email | String | Login credential |
| password | String | bcrypt hash — NEVER stored in plain text |
| role | Enum | SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL, HOD, TEACHER, PARENT, LEARNER |
| firstName | String | |
| lastName | String | |
| isActive | Boolean | |

---

### ScreeningRecord
Results of a Dyslexia or ADHD screener administered to a learner.

| Field | Type | Purpose |
|-------|------|---------|
| id | String (UUID) | |
| learnerId | String | |
| schoolId | String | |
| screenerType | Enum | DYSLEXIA, ADHD_INATTENTIVE, ADHD_HYPERACTIVE, ADHD_COMBINED |
| totalScore | Int | Raw score |
| riskLevel | Enum | LOW, MODERATE, HIGH |
| administeredAt | DateTime | |
| administeredById | String | User who ran the screener |
| reviewedByPrincipal | Boolean | Whether principal has reviewed |
| principalNotes | String? | |

---

### Subject and SubjectClass
`Subject` is the subject definition (e.g. Mathematics).
`SubjectClass` links a subject to a specific class for a specific year, with an allocated
teacher.

---

## Key Relationships Explained Simply

- **One School → Many Grades** (a school has Grade 8, Grade 9, etc.)
- **One Grade → Many Classes** (Grade 8 has BuPhe-8A, BuPhe-8B, MaPhu-8A, etc.)
- **One Class → Many LearnerEnrolments** (a class has 42–46 learners)
- **One Learner → One Active LearnerEnrolment** (a learner is in exactly one class per year)
- **One Learner → Many ScreeningRecords** (a learner can be screened multiple times)
- **One User → Many Classes** (a teacher can be the class teacher of multiple classes)

---

## The Seed File

`apps/api/prisma/seed.ts` is the script that creates the initial data when the database
is first set up. It creates:

1. The school record
2. The academic year
3. The CAPS phases
4. The grades
5. An initial SUPER_ADMIN user
6. All 24 classes (BuPhe, MaPhu, Kgapane — Grades 8 and 9)
7. 1 053 synthetic learners with realistic South African names

**For a new school:** Update the seed file with the new school's name, code, district, and
teacher accounts. The learner data would be imported from the existing school's records
(LURITS data, paper registers, etc.) rather than generated.

---

## Database Migrations

Every change to the schema is tracked as a migration:

```bash
# After editing schema.prisma:
npx prisma migrate dev --name describe-what-changed

# To apply migrations on a new database:
npx prisma migrate deploy

# To view current database state:
npx prisma studio
```

Migrations are stored in `apps/api/prisma/migrations/` and should be committed to version
control. They are the history of every structural change to the database.
