# South African Multi-School Learner Management System
# Database Design Document

**Version:** 1.0
**Date:** 2026-05-25
**Scope:** Multi-tenant PostgreSQL schema with Row Level Security, CAPS alignment, and Lurits compliance

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Entity Relationship Summary](#2-entity-relationship-summary)
3. [CAPS SBA Calculation Logic](#3-caps-sba-calculation-logic)
4. [CAPS Promotion Logic](#4-caps-promotion-logic)
5. [PostgreSQL RLS Policy Templates](#5-postgresql-rls-policy-templates)
6. [Key Indexes](#6-key-indexes)
7. [Seed Data Required](#7-seed-data-required)

---

## 1. Architecture Overview

### 1.1 Multi-Tenant Pool Model

This system uses a **shared database, shared schema** (pool model) multi-tenancy pattern. All schools share the same PostgreSQL database and the same set of tables. Each row in every tenant-scoped table carries a `school_id` column (UUID) that identifies which school owns that record.

This model was chosen over separate schemas or separate databases because:

- It scales to thousands of schools without schema proliferation or connection pool exhaustion.
- Migrations are applied once, not once per tenant.
- Cross-school analytics (e.g. provincial dashboards) are straightforward SQL queries with a `GROUP BY school_id`.
- PostgreSQL Row Level Security (RLS) enforces isolation at the database engine level, so no application bug can accidentally leak cross-school data.

The trade-off is that a misconfigured RLS policy or a forgotten `school_id` filter could expose data. The design addresses this by:

1. Enabling RLS on **every** tenant-scoped table.
2. Requiring the application layer to set `app.current_school_id` on every database connection before executing any query.
3. Using a `service_role` database role that bypasses RLS only for background jobs and migrations, never for the web API.

### 1.2 How PostgreSQL Row Level Security Works

RLS is a PostgreSQL feature (9.5+) that attaches filter predicates to tables. When RLS is enabled on a table, every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` automatically has the policy predicate appended as an invisible `WHERE` clause.

**Mechanism in this system:**

1. The FastAPI application opens a connection and immediately executes:
   ```sql
   SET app.current_school_id = '<uuid-of-authenticated-school>';
   SET app.current_user_id   = '<uuid-of-authenticated-user>';
   SET app.current_role      = 'teacher'; -- or 'admin', 'parent', etc.
   ```
2. Every subsequent query on that connection automatically sees only rows where `school_id = current_setting('app.current_school_id')::uuid`.
3. The application never needs to add `WHERE school_id = ?` manually — the database enforces it.
4. Background workers (cron jobs, report generators, Lurits exporters) connect as `service_role`, which has a bypass policy, and set `school_id` filters explicitly in their queries.

**Why this is stronger than application-layer filtering:**

- A developer forgetting a `WHERE school_id = ?` in application code becomes a silent data leak. With RLS, the same omission returns zero rows or raises a policy violation, making the bug immediately visible.
- SQL injection attacks that bypass application logic still cannot cross school boundaries.

### 1.3 Global vs Tenant-Scoped Tables

| Category | Table Type | Examples |
|---|---|---|
| **Global** | No `school_id`, no RLS | `provinces`, `districts`, `circuits`, `caps_phases`, `caps_subjects`, `performance_level_descriptors` |
| **Tenant-scoped** | Has `school_id`, RLS enabled | All school, learner, academic, and operational tables |
| **Audit** | Special: has `school_id` but stricter policy | `audit_logs` (append-only, no UPDATE/DELETE policy) |

Global tables are read-only reference data managed by system administrators. They are seeded once and rarely changed. All users across all schools can read them. Tenant-scoped tables are fully isolated per school.

### 1.4 Why `school_id` Appears on Every Tenant Table

Even tables that could theoretically derive their school from a parent (e.g. `learner_marks` could join up through `assessment_tasks` → `programme_of_assessment` → `subject_class` → `school_subject` → `school`) carry their own `school_id` column directly. This is intentional for three reasons:

1. **RLS simplicity.** The policy `school_id = current_setting(...)::uuid` works on any table without joins.
2. **Index efficiency.** The composite index `(school_id, ...)` on every table means tenant-scoped queries always use the most selective prefix.
3. **Denormalisation for performance.** Deep join chains to verify school ownership at query time would add latency on every read. Storing `school_id` directly is a deliberate denormalisation trade-off.

A database trigger or application-layer constraint enforces that inserted `school_id` values are consistent with the parent entity's `school_id`.

---

## 2. Entity Relationship Summary

### 2.1 Foundation / Global (Reference Data)

These tables form the geographic and curriculum backbone. They have no `school_id` and are shared across all tenants.

**Province → District → Circuit (geographic hierarchy)**

South Africa has 9 provinces. Each province contains multiple districts (there are 75 districts nationally). Each district contains multiple circuits (the smallest DBE administrative unit, roughly equivalent to a cluster of schools). A school belongs to a circuit, which implicitly places it in a district and province.

```
Province (1) ──< District (many)
District  (1) ──< Circuit  (many)
Circuit   (1) ──< School   (many)
```

This hierarchy is used primarily for reporting (provincial dashboards, district analytics) and for Lurits export headers which require the circuit code.

**CapsPhase → CapsSubject (curriculum catalogue)**

The DBE defines curriculum in phases: Intermediate Phase (Gr4-6), Senior Phase (Gr7-9), and FET Phase (Gr10-12). Each phase has a defined list of CAPS subjects. `CapsSubject` is the canonical national subject definition with its name, phase, and whether it is compulsory or elective.

```
CapsPhase (1) ──< CapsSubject (many)
```

Schools do not modify these records. They create their own `SchoolSubject` records that reference a `CapsSubject`, allowing for school-specific configuration (e.g. the language of instruction for a subject, or whether the school offers it).

---

### 2.2 School Setup

**School → AcademicYear → Term**

A school has many academic years (one per calendar year). Each academic year is divided into terms (typically 4). Terms carry their start and end dates, which drive the attendance register creation and term-based result calculations.

```
School        (1) ──< AcademicYear (many)
AcademicYear  (1) ──< Term         (many, typically 4)
```

**School → Grade**

A school offers grades. `Grade` links to a `CapsPhase` (which determines SBA weightings). A Grade record is school-specific because not every school offers every grade (some start at Gr4, some stop at Gr9, some run Gr8-12).

```
School     (1) ──< Grade      (many)
CapsPhase  (1) ──< Grade      (many)
```

**School → User (7 roles)**

Users are scoped to a school. The system supports seven roles:

| Role | Description |
|---|---|
| `system_admin` | Full access across all schools (service accounts only) |
| `school_admin` | Full access within their school |
| `principal` | Read access to all data; can approve promotion decisions |
| `hod` | Subject department head; manages subjects and POA |
| `teacher` | Captures marks, takes registers, manages their classes |
| `parent` | Read-only access to their linked learner's results |
| `learner` | Read-only access to their own results (portal login) |

A `User` record carries login credentials (hashed password or SSO token). Teachers are Users with role `teacher`. The same person can hold a `User` record at multiple schools (e.g. a teacher who works at two schools) — these are separate `User` records with different `school_id` values.

---

### 2.3 Learner Management

**Learner ↔ Guardian (many-to-many via LearnerGuardian)**

A learner can have multiple guardians (e.g. mother + father, or a legal guardian). A guardian (represented as a `User` with role `parent`) can be linked to multiple learners (e.g. siblings at the same school). The join table `LearnerGuardian` captures the relationship type (mother, father, legal guardian, emergency contact) and whether that guardian has portal access.

```
Learner  (many) ──< LearnerGuardian >── (many) User [parent role]
```

**Learner → LearnerEnrolment → Class + Grade + AcademicYear**

Enrolment is the record of a learner being placed in a specific class, in a specific grade, in a specific academic year. A learner has one enrolment per academic year. If a learner is promoted, a new `LearnerEnrolment` record is created for the next year. If a learner transfers schools, their enrolment at the old school is closed and a new one is opened at the new school.

```
Learner       (1)  ──< LearnerEnrolment (many, one per year)
LearnerEnrolment >── Class
LearnerEnrolment >── Grade
LearnerEnrolment >── AcademicYear
```

**User (optional portal login) ↔ Learner**

Gr10+ learners may be granted a portal login. In this case, a `User` record with role `learner` is created and linked to their `Learner` record via a nullable `user_id` foreign key on the `Learner` table. Gr4-9 learners do not typically have portal accounts; their results are accessed by their linked parent/guardian.

---

### 2.4 Academic Structure

**CapsSubject → SchoolSubject (school's instance of a national subject)**

`SchoolSubject` is a school's declaration that they offer a particular CAPS subject. It holds school-specific metadata: the language of instruction, which HOD is responsible, and whether it is currently active. Every `SchoolSubject` references exactly one `CapsSubject`.

```
CapsSubject  (1) ──< SchoolSubject (many, across all schools)
School       (1) ──< SchoolSubject (many, within one school)
```

**SchoolSubject → SubjectClass (the actual teaching group)**

A `SubjectClass` is the intersection of a subject, a class, and a teacher for a given academic year. It represents the group of learners who are taught a subject together. This is necessary because a single subject may be split across multiple classes (e.g. Maths is taught separately to 10A and 10B), and a single class may split into different groups for different subjects (e.g. learners choosing between Physical Science and Agricultural Sciences).

```
SchoolSubject   (1) ──< SubjectClass (many)
Class           (1) ──< SubjectClass (many, one per subject offered to that class)
User [teacher]  (1) ──< SubjectClass (many, one per subject taught)
AcademicYear    (1) ──< SubjectClass (many)
```

**Class (home group) vs SubjectClass (teaching group): the key distinction**

| Concept | `Class` | `SubjectClass` |
|---|---|---|
| Purpose | Administrative home group | Teaching and assessment group |
| Example | "10A" | "10A Mathematics with Mrs Dlamini" |
| Used for | Attendance registers, homeroom teacher, report card header | Mark capture, timetabling, POA |
| Learner membership | Via `LearnerEnrolment` | Implied by enrolment + subject selection |
| One teacher? | Homeroom teacher (optional) | Subject teacher (required) |

A learner in Class 10A is automatically in the 10A SubjectClass for each subject offered to 10A. If the school splits Maths into a higher and standard group that cross class lines, those learners' SubjectClass memberships differ from their Class membership — this is handled by an explicit `SubjectClassEnrolment` join table.

---

### 2.5 Timetabling

**Period + SubjectClass + Venue → TimetableSlot**

The timetable is represented as a set of `TimetableSlot` records. Each slot links a `Period` (a day-of-week + time slot definition), a `SubjectClass` (what is being taught), and optionally a `Venue` (the room). This structure supports:

- Clash detection (a teacher or venue cannot have two slots at the same period).
- Substitution management (temporarily reassigning a slot to a different teacher).
- Automated attendance register generation (the system knows which class meets on which days).

```
Period       (1) ──< TimetableSlot (many)
SubjectClass (1) ──< TimetableSlot (many)
Venue        (1) ──< TimetableSlot (many, optional)
```

---

### 2.6 Attendance

**Class + Date → AttendanceRegister → AttendanceRecord per Learner**

An `AttendanceRegister` is created for each class on each school day. The register is linked to the class and the date. Each learner enrolled in that class on that date has one `AttendanceRecord` in the register, with a status value: `present`, `absent`, `late`, `absent_with_reason`, or `excused`.

```
Class               (1) ──< AttendanceRegister  (many, one per school day)
AttendanceRegister  (1) ──< AttendanceRecord     (many, one per learner)
Learner             (1) ──< AttendanceRecord     (many)
```

Registers are auto-generated by a nightly job based on the school calendar. Teachers open the register for their class, capture status for each learner, and submit it. Once submitted, the register is locked and can only be amended by a school admin with a recorded reason.

---

### 2.7 Assessment

**SubjectClass + Term → ProgrammeOfAssessment → AssessmentTask**

The Programme of Assessment (POA) is the CAPS-mandated plan of all formal assessment tasks for a subject in a term. A `ProgrammeOfAssessment` record belongs to a `SubjectClass` and a `Term`. It contains the list of `AssessmentTask` records that make it up.

Each `AssessmentTask` has a task type (test, assignment, project, practical, exam), a maximum mark, a weight within the term's SBA, and a due date.

```
SubjectClass          (1) ──< ProgrammeOfAssessment (many, one per term)
ProgrammeOfAssessment (1) ──< AssessmentTask        (many)
```

**AssessmentTask + Learner → LearnerMark**

When a teacher captures results, a `LearnerMark` record is created for each learner per task. It stores the raw mark, any absence or exemption flags, and a timestamp of when it was captured and by whom.

```
AssessmentTask (1) ──< LearnerMark (many, one per learner)
Learner        (1) ──< LearnerMark (many)
```

**Learner → DiagnosticAssessment (per subject per year)**

At the start of an academic year (or per term for intervention tracking), a `DiagnosticAssessment` records a learner's baseline performance per subject. This is separate from the POA and is used to flag at-risk learners and measure growth.

**Learner → LearningProfile (per year)**

A `LearningProfile` stores qualitative information about a learner for a given academic year: learning support needs, language accommodation requirements, IEP status, and teacher notes. It is scoped per academic year because a learner's needs may change from year to year.

---

### 2.8 Computed Results

**LearnerMark aggregation → TermSbaResult**

`TermSbaResult` is a computed/cached table. It holds the aggregated SBA mark for a learner for a subject for a term. It is not entered manually; it is recalculated every time a `LearnerMark` is added or updated. The calculation applies task weights, handles absent/exempted tasks, and converts the raw total to a percentage. (See Section 3 for full calculation logic.)

```
LearnerMark (many) ──> TermSbaResult (1 per learner per subject per term)
```

**TermSbaResult aggregation → AnnualSubjectResult**

`AnnualSubjectResult` is the end-of-year result for a learner for a subject. It combines the SBA mark across all terms with the final exam mark using the phase-specific weighting (e.g. 40% SBA + 60% exam for FET). It also stores the performance level (1-7) derived from the final mark percentage. (See Section 3 for full calculation logic.)

```
TermSbaResult (many, across terms) ──> AnnualSubjectResult
```

---

### 2.9 Reporting

**AnnualSubjectResult → ReportCard**

A `ReportCard` is a snapshot of a learner's results at a point in time (end of term or end of year). It references the learner, the academic year, the term or year-end period, and aggregates all `AnnualSubjectResult` (or `TermSbaResult` for mid-year reports) records for that learner. The `ReportCard` record is the anchor for PDF generation; the actual subject results are stored in the linked result tables, not duplicated in the report card.

**AnnualSubjectResult → PromotionDecision**

At the end of the academic year, the system runs the promotion engine (Section 4) across all `AnnualSubjectResult` records for a learner and writes a `PromotionDecision` record. This stores the auto-calculated recommendation (`promote`, `progress`, `repeat`), the specific criteria that were met or failed, and a field for the principal's override with a recorded reason.

```
AnnualSubjectResult (many) ──> PromotionDecision (1 per learner per academic year)
```

---

### 2.10 Communication and Compliance

**User → Notification**

`Notification` records are created when system events occur (mark published, report card available, attendance alert). Each notification is addressed to a specific `User` and carries a channel flag (`in_app`, `email`, `sms`). Delivery status and timestamps are tracked.

**School → LuritsExportBatch**

Lurits is the DBE's Learner Unit Record Information Tracking System. A `LuritsExportBatch` records each time a school generates a Lurits-compliant export file. It stores the export type, the date range, the file path, and the submission status. Individual learner records included in the batch are tracked in a `LuritsExportRecord` join table.

---

### 2.11 Finance

**School → FeeStructure → Invoice → Payment**

A `FeeStructure` defines the school's fee schedule for an academic year (tuition, activity fees, etc.) with amounts per grade. When a learner enrols, `Invoice` records are generated based on the applicable `FeeStructure`. Each `Payment` record reduces the outstanding balance on an invoice. The system tracks payment method, reference number, and reconciliation status.

```
School        (1) ──< FeeStructure (many, one per year)
FeeStructure  (1) ──< Invoice      (many, one per learner per fee line)
Invoice       (1) ──< Payment      (many)
```

---

## 3. CAPS SBA Calculation Logic

### 3.1 Phase Weightings

The DBE prescribes how SBA marks and exam marks are weighted to produce the final subject mark. These weightings differ by phase:

| Phase | Grades | SBA Weight | Exam/Final Assessment Weight |
|---|---|---|---|
| Intermediate Phase | Gr4-6 | 75% | 25% |
| Senior Phase | Gr7-9 | 60% | 40% |
| FET Phase (Gr10-11) | Gr10-11 | 40% | 60% |
| FET Phase (Gr12) | Gr12 | 25% | 75% |

These weightings are stored in the `CapsPhase` table as `sba_weight` and `exam_weight` decimal columns. They are referenced during `AnnualSubjectResult` calculation.

Note: For Intermediate and Senior Phase, the "exam" is typically the end-of-year formal assessment or examination, not necessarily a separate NSC-style exam. The same weighting logic applies.

### 3.2 How TermSbaResult is Computed

For a given learner, subject, and term:

**Step 1: Collect all AssessmentTask records** for the relevant `ProgrammeOfAssessment` (the POA for that `SubjectClass` and `Term`).

**Step 2: For each task, determine the effective mark:**

| Learner status on task | Effective mark used |
|---|---|
| Mark captured normally | Raw mark as entered |
| Absent (unexcused) | 0 |
| Absent with medical certificate | Task is exempted (excluded from calculation) |
| Exempted by HOD/admin | Task is excluded from calculation |
| Mark not yet captured | Task is excluded (partial calculation) |

**Step 3: Calculate the weighted SBA percentage:**

```
For each non-exempted task:
  task_contribution = (learner_raw_mark / task_max_mark) × task_weight

SBA_percentage = SUM(task_contribution) / SUM(task_weight of non-exempted tasks) × 100
```

Where `task_weight` is the percentage weight of each task within the term's SBA (e.g. a term might have Test 1 at 30%, Assignment at 20%, Test 2 at 50%, summing to 100%).

**Step 4: Store the result in `TermSbaResult`:**

Fields stored:
- `raw_weighted_total` — numerator of the weighted calculation
- `effective_weight_total` — denominator (sum of non-exempted task weights)
- `sba_percentage` — final percentage (rounded to 1 decimal place)
- `tasks_total` — count of tasks in POA
- `tasks_captured` — count of tasks with marks entered
- `tasks_exempted` — count of tasks excluded from calculation
- `is_complete` — boolean, true only when all tasks are captured

**Step 5: Recalculation trigger:**

A PostgreSQL trigger on `learner_marks` (INSERT, UPDATE, DELETE) calls a stored function `recalculate_term_sba_result(learner_id, subject_class_id, term_id)`. This is an `AFTER` trigger that runs as a deferred constraint trigger to batch multiple updates in a single transaction.

### 3.3 How AnnualSubjectResult.finalMark is Computed

At the end of the academic year, after the final exam mark is captured (as a special `AssessmentTask` of type `exam`):

**Step 1: Retrieve SBA marks across all terms:**

```
annual_sba_percentage = AVG(sba_percentage) across all TermSbaResult records
                        for this learner + subject + academic year
```

For some subjects, the DBE specifies that only certain terms contribute to the annual SBA (e.g. Gr12 uses all four terms equally). The `CapsSubject` table stores a `sba_term_aggregation_method` enum: `average_all_terms`, `average_best_three`, or `cumulative_weighted`.

**Step 2: Retrieve the exam mark:**

The final exam or year-end assessment mark is stored as a `LearnerMark` on the exam-type `AssessmentTask`. It is stored as a percentage.

**Step 3: Apply phase weighting:**

```
final_mark = (annual_sba_percentage × sba_weight)
           + (exam_mark_percentage  × exam_weight)
```

Where `sba_weight` and `exam_weight` are the phase weightings from `CapsPhase` (see Section 3.1).

**Step 4: Derive performance level:**

| Percentage | Performance Level | CAPS Description |
|---|---|---|
| 80-100% | 7 | Outstanding Achievement |
| 70-79% | 6 | Meritorious Achievement |
| 60-69% | 5 | Substantial Achievement |
| 50-59% | 4 | Adequate Achievement |
| 40-49% | 3 | Moderate Achievement |
| 30-39% | 2 | Elementary Achievement |
| 0-29% | 1 | Not Achieved |

**Step 5: Store in AnnualSubjectResult:**

Fields stored: `annual_sba_percentage`, `exam_mark_percentage`, `final_mark`, `performance_level`, `is_passed` (true if `final_mark >= 30`), and `contributing_term_count`.

### 3.4 Edge Cases

| Edge Case | Handling |
|---|---|
| Learner absent for ALL tasks in a term | `sba_percentage = 0`, `is_complete = true` (all tasks resolved as absent = 0) |
| Learner has medical exemption for ALL tasks | `sba_percentage = NULL`, flagged as `fully_exempted = true`; excluded from average; HOD must adjudicate |
| Missing marks at year end | `AnnualSubjectResult` is not generated until all mandatory tasks have marks; system shows "incomplete" warning |
| Task weight sum ≠ 100% | System raises a validation error on POA submission; HOD cannot finalise POA with unbalanced weights |
| Exam mark not yet captured | `AnnualSubjectResult.final_mark` is null; report card generation is blocked |
| Learner transfers mid-year | `TermSbaResult` records from the previous school are imported via Lurits transfer; the system uses imported percentages for completed terms |
| Subject not offered at receiving school | Flagged in `LearnerEnrolment.transfer_subject_flags`; principal must resolve before promotion decision |

---

## 4. CAPS Promotion Logic

The promotion engine runs at the end of the academic year after all `AnnualSubjectResult` records are finalised. It writes a `PromotionDecision` record for each learner with a recommendation and the specific pass/fail status of each criterion.

### 4.1 Intermediate Phase (Gr4-6) Criteria

A learner in the Intermediate Phase must achieve a minimum of **Level 3 (40%)** in:

- Home Language
- First Additional Language
- Mathematics

AND a minimum of **Level 2 (30%)** in at least 4 of the remaining subjects.

**Automatic promotion criteria summary:**

| Requirement | Minimum Level | Minimum % |
|---|---|---|
| Home Language | Level 3 | 40% |
| First Additional Language | Level 3 | 40% |
| Mathematics | Level 3 | 40% |
| 4 other subjects (from remaining) | Level 2 | 30% |

If any of the three core subjects fall below Level 3, or if fewer than 4 of the remaining subjects reach Level 2, the recommendation is `repeat`.

### 4.2 Senior Phase (Gr7-9) Criteria

A learner in the Senior Phase must achieve a minimum of **Level 3 (40%)** in:

- Home Language
- First Additional Language
- Mathematics OR Mathematical Literacy (if offered)

AND a minimum of **Level 2 (30%)** in at least 4 of the remaining subjects.

The criteria mirror the Intermediate Phase but apply to 7-subject loads typical of Gr7-9. Natural Sciences and Technology, Economic Management Sciences, and Life Orientation are among the subjects evaluated.

### 4.3 FET Phase Gr10-11 Criteria

A learner in the FET Phase must achieve a minimum of **Level 3 (40%)** in:

- Home Language (or any language subject at Home Language level)
- At least 3 other subjects

AND a minimum of **Level 2 (30%)** in at least 2 of the remaining subjects.

The requirement is effectively: pass at least 4 subjects at 40% or higher, and pass at least 2 more at 30% or higher, from a 7-subject load.

| Requirement | Count | Minimum % |
|---|---|---|
| Subjects at Level 3+ (incl. Home Language) | 4 | 40% |
| Additional subjects at Level 2+ | 2 | 30% |
| Life Orientation | 1 | 30% (compulsory, must be passed separately) |

### 4.4 Progression Rules (Maximum Repeats per Phase)

CAPS allows a learner to repeat a grade only once within a phase. After a second consecutive failure, the learner must be **progressed** to the next grade regardless of marks.

| Phase | Maximum Repeats |
|---|---|
| Intermediate Phase (Gr4-6) | 1 repeat per phase (not per grade) |
| Senior Phase (Gr7-9) | 1 repeat per phase |
| FET Phase (Gr10-12) | 1 repeat per phase |

The system tracks repeats in a `LearnerPhaseHistory` table, which records each academic year a learner spent in each phase. The promotion engine checks this table:

```
IF criteria_met THEN recommendation = 'promote'
ELSE IF phase_repeats >= max_phase_repeats THEN recommendation = 'progress'
     (learner moves up despite failing — principal must acknowledge)
ELSE recommendation = 'repeat'
```

A `progressed` learner carries a flag in their next year's `LearnerEnrolment` record, indicating they require additional support.

### 4.5 How PromotionDecision.recommendation is Auto-Calculated

The promotion engine stored procedure `calculate_promotion_decision(learner_id, academic_year_id)` performs the following steps:

1. **Fetch all `AnnualSubjectResult` records** for the learner and year.
2. **Verify completeness** — if any result is null or incomplete, halt and flag `status = 'incomplete'`.
3. **Identify phase** from the learner's grade via `Grade.caps_phase_id`.
4. **Apply phase-specific criteria** (Sections 4.1-4.3) to each subject result.
5. **Build a criteria detail JSON object** storing pass/fail per subject and per criterion. This is stored in `PromotionDecision.criteria_detail` (JSONB column) for full auditability.
6. **Check `LearnerPhaseHistory`** for prior repeats in this phase.
7. **Set `recommendation`** to `promote`, `progress`, or `repeat`.
8. **Set `auto_calculated_at`** timestamp.
9. **Leave `principal_override`** and `override_reason` null (to be filled by principal if they disagree).

The principal can review the decision and set `principal_override` to a different recommendation with a mandatory `override_reason`. Both the auto-calculated recommendation and the override are preserved for audit purposes.

---

## 5. PostgreSQL RLS Policy Templates

The following SQL establishes Row Level Security for five representative tables. The pattern is consistent: enable RLS, create a school isolation policy for regular users, and a service bypass policy for background workers.

### 5.1 learners

```sql
-- Enable RLS
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see learners at their school
CREATE POLICY school_isolation ON learners
  AS PERMISSIVE
  FOR ALL
  TO app_user
  USING (school_id = current_setting('app.current_school_id')::uuid)
  WITH CHECK (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: service role bypasses RLS for background jobs and migrations
CREATE POLICY service_bypass ON learners
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: parent role can only see their linked learners
CREATE POLICY parent_learner_scope ON learners
  AS RESTRICTIVE
  FOR SELECT
  TO app_user
  USING (
    current_setting('app.current_role') != 'parent'
    OR id IN (
      SELECT learner_id
      FROM learner_guardians
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );
```

### 5.2 learner_marks

```sql
-- Enable RLS
ALTER TABLE learner_marks ENABLE ROW LEVEL SECURITY;

-- Policy: school isolation (primary filter)
CREATE POLICY school_isolation ON learner_marks
  AS PERMISSIVE
  FOR ALL
  TO app_user
  USING (school_id = current_setting('app.current_school_id')::uuid)
  WITH CHECK (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: service role bypass
CREATE POLICY service_bypass ON learner_marks
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: teachers can only capture marks for their own subject classes
CREATE POLICY teacher_subject_scope ON learner_marks
  AS RESTRICTIVE
  FOR INSERT
  TO app_user
  WITH CHECK (
    current_setting('app.current_role') NOT IN ('teacher')
    OR assessment_task_id IN (
      SELECT at.id
      FROM assessment_tasks at
      JOIN programmes_of_assessment poa ON poa.id = at.programme_of_assessment_id
      JOIN subject_classes sc           ON sc.id  = poa.subject_class_id
      WHERE sc.teacher_user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Policy: parents can only read marks for their children
CREATE POLICY parent_child_scope ON learner_marks
  AS RESTRICTIVE
  FOR SELECT
  TO app_user
  USING (
    current_setting('app.current_role') != 'parent'
    OR learner_id IN (
      SELECT learner_id
      FROM learner_guardians
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );
```

### 5.3 assessment_tasks

```sql
-- Enable RLS
ALTER TABLE assessment_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: school isolation
CREATE POLICY school_isolation ON assessment_tasks
  AS PERMISSIVE
  FOR ALL
  TO app_user
  USING (school_id = current_setting('app.current_school_id')::uuid)
  WITH CHECK (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: service role bypass
CREATE POLICY service_bypass ON assessment_tasks
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: teachers can only modify tasks in their own subject classes
CREATE POLICY teacher_poa_scope ON assessment_tasks
  AS RESTRICTIVE
  FOR ALL  -- INSERT, UPDATE, DELETE
  TO app_user
  USING (
    current_setting('app.current_role') IN ('school_admin', 'principal', 'hod')
    OR programme_of_assessment_id IN (
      SELECT poa.id
      FROM programmes_of_assessment poa
      JOIN subject_classes sc ON sc.id = poa.subject_class_id
      WHERE sc.teacher_user_id = current_setting('app.current_user_id')::uuid
    )
  )
  WITH CHECK (
    current_setting('app.current_role') IN ('school_admin', 'principal', 'hod')
    OR programme_of_assessment_id IN (
      SELECT poa.id
      FROM programmes_of_assessment poa
      JOIN subject_classes sc ON sc.id = poa.subject_class_id
      WHERE sc.teacher_user_id = current_setting('app.current_user_id')::uuid
    )
  );
```

### 5.4 report_cards

```sql
-- Enable RLS
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

-- Policy: school isolation
CREATE POLICY school_isolation ON report_cards
  AS PERMISSIVE
  FOR ALL
  TO app_user
  USING (school_id = current_setting('app.current_school_id')::uuid)
  WITH CHECK (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: service role bypass
CREATE POLICY service_bypass ON report_cards
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: parents can only view report cards for their children
CREATE POLICY parent_child_scope ON report_cards
  AS RESTRICTIVE
  FOR SELECT
  TO app_user
  USING (
    current_setting('app.current_role') != 'parent'
    OR learner_id IN (
      SELECT learner_id
      FROM learner_guardians
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Policy: learner portal users can only view their own report card
CREATE POLICY learner_self_scope ON report_cards
  AS RESTRICTIVE
  FOR SELECT
  TO app_user
  USING (
    current_setting('app.current_role') != 'learner'
    OR learner_id IN (
      SELECT id
      FROM learners
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Policy: report cards are read-only once published (no UPDATE by non-admin)
CREATE POLICY published_immutable ON report_cards
  AS RESTRICTIVE
  FOR UPDATE
  TO app_user
  USING (
    current_setting('app.current_role') IN ('school_admin', 'principal')
    OR is_published = false
  );
```

### 5.5 audit_logs

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: school isolation (all staff at a school can read their own audit log)
CREATE POLICY school_isolation ON audit_logs
  AS PERMISSIVE
  FOR SELECT
  TO app_user
  USING (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: append-only — no application user may UPDATE or DELETE audit records
CREATE POLICY no_update ON audit_logs
  AS RESTRICTIVE
  FOR UPDATE
  TO app_user
  USING (false);  -- nobody can update audit logs through app_user role

CREATE POLICY no_delete ON audit_logs
  AS RESTRICTIVE
  FOR DELETE
  TO app_user
  USING (false);  -- nobody can delete audit logs through app_user role

-- Policy: INSERT is allowed (triggers write here, not direct app inserts)
CREATE POLICY insert_allowed ON audit_logs
  AS PERMISSIVE
  FOR INSERT
  TO app_user
  WITH CHECK (school_id = current_setting('app.current_school_id')::uuid);

-- Policy: service role can read all audit logs (for compliance reporting)
CREATE POLICY service_bypass ON audit_logs
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: only school_admin and principal can read audit logs (not teachers/parents)
CREATE POLICY admin_read_only ON audit_logs
  AS RESTRICTIVE
  FOR SELECT
  TO app_user
  USING (
    current_setting('app.current_role') IN ('school_admin', 'principal', 'system_admin')
  );
```

---

## 6. Key Indexes

All indexes are composite, with `school_id` as the first column to maximise selectivity in the multi-tenant pool model.

### 6.1 Learner Search

```sql
-- Search by name (school + last name + first name)
CREATE INDEX idx_learners_school_name
  ON learners (school_id, last_name, first_name);

-- Lookup by student number (unique within a school)
CREATE UNIQUE INDEX idx_learners_school_student_number
  ON learners (school_id, student_number);

-- Lookup by Lurits EMIS number (national identifier)
CREATE UNIQUE INDEX idx_learners_school_lurits_number
  ON learners (school_id, lurits_number)
  WHERE lurits_number IS NOT NULL;

-- Full-text search index for learner name (supports partial matches)
CREATE INDEX idx_learners_name_fts
  ON learners USING GIN (
    to_tsvector('english', coalesce(first_name,'') || ' ' || coalesce(last_name,''))
  );
```

### 6.2 Mark Capture

```sql
-- Primary lookup: all marks for a specific task within a school
CREATE INDEX idx_learner_marks_school_task
  ON learner_marks (school_id, assessment_task_id);

-- Lookup: all marks for a specific learner (for result aggregation)
CREATE INDEX idx_learner_marks_school_learner
  ON learner_marks (school_id, learner_id);

-- Compound: unique constraint enforcing one mark per learner per task
CREATE UNIQUE INDEX idx_learner_marks_task_learner_unique
  ON learner_marks (assessment_task_id, learner_id);

-- SBA recalculation: all marks for a learner in a subject class
CREATE INDEX idx_learner_marks_school_task_learner
  ON learner_marks (school_id, assessment_task_id, learner_id);
```

### 6.3 Attendance

```sql
-- Fetch register for a class on a specific date
CREATE INDEX idx_attendance_registers_school_class_date
  ON attendance_registers (school_id, class_id, register_date);

-- Fetch all records in a register
CREATE INDEX idx_attendance_records_register
  ON attendance_records (attendance_register_id);

-- Attendance history for a learner (for absence reports)
CREATE INDEX idx_attendance_records_school_learner_date
  ON attendance_records (school_id, learner_id, register_date);

-- Absent learners on a date (for daily absence notifications)
CREATE INDEX idx_attendance_records_absent
  ON attendance_records (school_id, register_date, status)
  WHERE status IN ('absent', 'absent_with_reason');
```

### 6.4 Report Cards

```sql
-- Fetch a learner's report card for a specific year
CREATE INDEX idx_report_cards_school_learner_year
  ON report_cards (school_id, learner_id, academic_year_id);

-- Fetch all published report cards for a year (bulk download)
CREATE INDEX idx_report_cards_school_year_published
  ON report_cards (school_id, academic_year_id, is_published)
  WHERE is_published = true;

-- Unique: one report card per learner per term per year
CREATE UNIQUE INDEX idx_report_cards_learner_year_term_unique
  ON report_cards (learner_id, academic_year_id, term_id)
  WHERE term_id IS NOT NULL;
```

### 6.5 Promotion Decisions

```sql
-- Fetch promotion decision for a learner in a year
CREATE INDEX idx_promotion_decisions_school_learner_year
  ON promotion_decisions (school_id, learner_id, academic_year_id);

-- Fetch all decisions for a year (for school-wide promotion review)
CREATE INDEX idx_promotion_decisions_school_year_recommendation
  ON promotion_decisions (school_id, academic_year_id, recommendation);

-- Unique: one decision per learner per year
CREATE UNIQUE INDEX idx_promotion_decisions_learner_year_unique
  ON promotion_decisions (learner_id, academic_year_id);
```

### 6.6 Additional Performance-Critical Indexes

```sql
-- Subject class membership (used on every mark capture and report)
CREATE INDEX idx_subject_class_enrolments_school_learner
  ON subject_class_enrolments (school_id, learner_id);

-- Annual subject results (used on every report card and promotion decision)
CREATE INDEX idx_annual_subject_results_school_learner_year
  ON annual_subject_results (school_id, learner_id, academic_year_id);

-- Term SBA results (used on every SBA recalculation)
CREATE INDEX idx_term_sba_results_school_learner_subject_term
  ON term_sba_results (school_id, learner_id, subject_class_id, term_id);

-- Learner enrolments (used on every learner lookup by class)
CREATE INDEX idx_learner_enrolments_school_class_year
  ON learner_enrolments (school_id, class_id, academic_year_id);
```

---

## 7. Seed Data Required

The following data must be present in the database before any school can be onboarded. All seed data is global (no `school_id`) and is applied via a migration script run once at system initialisation.

### 7.1 South African Provinces (9 records)

| Code | Name |
|---|---|
| EC | Eastern Cape |
| FS | Free State |
| GP | Gauteng |
| KZN | KwaZulu-Natal |
| LP | Limpopo |
| MP | Mpumalanga |
| NC | Northern Cape |
| NW | North West |
| WC | Western Cape |

### 7.2 CAPS Phases (3 records with weightings)

| Phase Name | Grades | SBA Weight | Exam Weight | Max Repeats per Phase |
|---|---|---|---|---|
| Intermediate Phase | 4-6 | 75% | 25% | 1 |
| Senior Phase | 7-9 | 60% | 40% | 1 |
| FET Phase | 10-12 | See below | See below | 1 |

FET Phase weightings are grade-specific within the phase:

| Grade | SBA Weight | Exam Weight |
|---|---|---|
| 10 | 40% | 60% |
| 11 | 40% | 60% |
| 12 | 25% | 75% |

This is handled by a `grade_specific_weightings` JSONB column on `CapsPhase`, overriding the default `sba_weight` for Gr12.

### 7.3 CAPS Subjects by Phase

#### Intermediate Phase (Gr4-6)

| Subject | Category | Compulsory |
|---|---|---|
| Home Language | Languages | Yes |
| First Additional Language | Languages | Yes |
| Mathematics | Mathematics | Yes |
| Natural Sciences and Technology | Sciences | Yes |
| Social Sciences | Social Sciences | Yes |
| Life Skills | Life Skills | Yes |
| Economic Management Sciences | EMS | No (offered at some schools) |
| Arts and Culture | Arts | No |

#### Senior Phase (Gr7-9)

| Subject | Category | Compulsory |
|---|---|---|
| Home Language | Languages | Yes |
| First Additional Language | Languages | Yes |
| Second Additional Language | Languages | No |
| Mathematics | Mathematics | Yes |
| Natural Sciences | Sciences | Yes |
| Social Sciences | Social Sciences | Yes |
| Technology | Technology | Yes |
| Economic Management Sciences | EMS | Yes |
| Life Orientation | Life Skills | Yes |
| Creative Arts | Arts | Yes |

#### FET Phase (Gr10-12) — Compulsory Subjects

| Subject | Category | Compulsory |
|---|---|---|
| Home Language | Languages | Yes |
| First Additional Language | Languages | Yes |
| Life Orientation | Life Skills | Yes |
| Mathematics OR Mathematical Literacy | Mathematics | Yes (one of the two) |

#### FET Phase (Gr10-12) — Elective Subjects (school must offer at least 3)

| Subject | Stream |
|---|---|
| Physical Sciences | Sciences |
| Life Sciences | Sciences |
| Geography | Social Sciences |
| History | Social Sciences |
| Accounting | Commerce |
| Business Studies | Commerce |
| Economics | Commerce |
| Information Technology | Technology |
| Computer Applications Technology | Technology |
| Engineering Graphics and Design | Technology |
| Agricultural Sciences | Agriculture |
| Consumer Studies | Consumer Sciences |
| Hospitality Studies | Consumer Sciences |
| Tourism | Commerce |
| Visual Arts | Arts |
| Music | Arts |
| Dramatic Arts | Arts |
| Religion Studies | Humanities |
| Civil Technology | Technology |
| Electrical Technology | Technology |
| Mechanical Technology | Technology |

### 7.4 Performance Level Descriptors (7 records)

| Level | Description | Percentage Range | Symbol (Gr10-12) |
|---|---|---|---|
| 7 | Outstanding Achievement | 80-100% | A |
| 6 | Meritorious Achievement | 70-79% | B |
| 5 | Substantial Achievement | 60-69% | C |
| 4 | Adequate Achievement | 50-59% | D |
| 3 | Moderate Achievement | 40-49% | E |
| 2 | Elementary Achievement | 30-39% | F |
| 1 | Not Achieved | 0-29% | G |

These descriptors are stored in the `performance_level_descriptors` table and referenced by `AnnualSubjectResult.performance_level` (integer 1-7).

### 7.5 Assessment Task Types (reference enum values)

The following task types must be seeded as enum values or a reference table:

| Code | Description | Applies to Phase |
|---|---|---|
| `test` | Formal written test | All phases |
| `assignment` | Take-home assignment | All phases |
| `project` | Extended project | All phases |
| `practical` | Practical/laboratory work | Senior + FET |
| `oral` | Oral/presentation | All phases |
| `portfolio` | Portfolio of evidence | Intermediate + Senior |
| `performance_task` | Performance task | Intermediate |
| `exam` | End-of-year examination | All phases |
| `trial_exam` | Trial/mock examination | FET (Gr12) |
| `diagnostic` | Diagnostic assessment | All phases |

### 7.6 Minimum Viable Seed Script Order

The following order must be respected due to foreign key dependencies:

```
1. provinces
2. districts          (→ provinces)
3. circuits           (→ districts)
4. caps_phases
5. caps_subjects      (→ caps_phases)
6. performance_level_descriptors
7. assessment_task_types  (enum/reference)
```

Schools, users, learners, and all tenant-scoped data are created after this seed data is in place, either through the onboarding wizard or via bulk import.

---

*End of Document*

---

**Document metadata:**

| Field | Value |
|---|---|
| Author | LMS Project Team |
| Last updated | 2026-05-25 |
| Database engine | PostgreSQL 15+ |
| ORM | SQLAlchemy (Python) with Alembic migrations |
| Schema versioning | Alembic revision history |
| Next review | After Phase 1 implementation |
