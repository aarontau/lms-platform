# 04 — Features

This document describes every module in the platform: what it does, who uses it,
where the code lives, and any important design decisions.

---

## Navigation Structure

The sidebar groups features into three sections:

**Main**
- Dashboard

**Academic**
- Learners
- Subjects & Classes
- Timetable
- Attendance
- Assessment
- Diagnostic Assessment
- Class Lists

**Management** *(Principal / School Admin only for starred items)*
- Analytics
- Report Cards
- Screeners ★ *(password-protected)*
- Communications
- LURITS Export ★
- Finance ★
- HR ★
- Users
- Settings

---

## Dashboard
**Route:** `/dashboard`  
**Users:** All staff  
**Purpose:** At-a-glance overview of the school — learner counts, attendance rate, pending
reviews, quick links.

Designed as the first screen a teacher or principal sees after login. Shows headline numbers
without requiring navigation into specific modules.

---

## Learners
**Route:** `/learners` and `/learners/[id]`  
**Users:** All staff  
**Purpose:** The master learner register — every learner's biographical data, enrolment,
guardians, and linked records.

Key features:
- Filterable list by grade, class, status, and search
- Learner profile page showing: personal details, current class, enrolment history,
  guardian contacts, screener history
- Add/edit learner modal
- Bulk import via CSV
- Deactivation (not deletion — learner records are never deleted, only marked inactive)

**Important design decision:** Learner records are soft-deleted (a `deletedAt` timestamp)
rather than hard-deleted. A learner who transfers out or graduates remains in the database
for historical records and reporting purposes.

---

## Subjects & Classes
**Route:** `/subjects`  
**Users:** All staff  
**Purpose:** Manage subject definitions and link subjects to specific classes with allocated teachers.

---

## Timetable
**Route:** `/timetable`  
**Users:** All staff  
**Purpose:** Weekly class schedule per grade/class.

---

## Attendance
**Route:** `/attendance`  
**Users:** Teachers, HODs, Principal  
**Purpose:** Daily attendance capture — present, absent, late, excused.

Attendance is captured per class per date. The system creates an `AttendanceRegister` for
each class day and an `AttendanceEntry` for each learner in that class. Teachers mark
attendance; HODs and principals can view aggregate reports.

---

## Assessment (Programme of Assessment)
**Route:** `/assessment` and `/assessment/poa/[id]`  
**Users:** Teachers, HODs, Principal  
**Purpose:** The formal CAPS-aligned Programme of Assessment — the schedule and record of
all formal assessment tasks for a grade and subject across the year.

Task types: Diagnostic, Class Test, Assignment, Homework, Oral, Practical, Summative Exam.

---

## Diagnostic Assessment (DA)
**Route:** `/assessment/diagnostic` and `/assessment/diagnostic/[subject]/[grade]`  
**Users:** Teachers, HODs, Principal  
**Purpose:** Baseline assessment instrument for the start of the year. Not grade-level
content — it assesses the requisite knowledge a learner must have to access the current
grade's curriculum.

**Six DAs are defined:**
| Subject | Grade | Assesses |
|---------|-------|---------|
| Mathematics | 8 | Grade 7 requisite knowledge |
| Mathematics | 9 | Grade 8 requisite knowledge |
| Natural Science | 8 | Grade 7 requisite knowledge |
| Natural Science | 9 | Grade 8 requisite knowledge |
| English | 8 | Grade 7 requisite knowledge |
| English | 9 | Grade 8 requisite knowledge |

**Four sections per DA** (25 marks total):
- Section A: MCQ (5 × 1 mark)
- Section B: Matching (5 × 1 mark)
- Section C: True/False (5 × 1 mark)
- Section D: Reasoned MCQ (5 × 2 marks: 1 answer + 1 reasoning)

The question bank lives in `apps/web/src/lib/da-questions.ts`. Adding or changing questions
requires only editing that file — no database changes needed.

The "Show Memo" button on the paper page reveals correct answers and marking notes for
Section D. The memo is hidden from the printed output.

**Next step:** Build score entry (teacher captures marks per learner) and baseline reporting
(principal views class-by-class and learner-by-learner results).

---

## Class Lists
**Route:** `/classlists`  
**Users:** All staff  
**Purpose:** Printable class registers — sorted alphabetically, with columns for student
number, surname, first name, gender, date of birth, home language, and a signature column.

Selectors cascade: Centre → Grade → Class. The print function uses a CSS class-mode
technique (adding `classlist-print-mode` to `<body>`) to hide all navigation and print
only the register document.

The school seal appears on the printed register with the same visual hierarchy as the
sidebar: UL-Junior Project in gold, MWED-BUPHEPHUKGAMA in secondary position.

---

## Screeners (Diagnostic Screeners)
**Route:** `/screening` and `/screening/[id]`  
**Users:** Principal only (password-gated)  
**Purpose:** DSM-5-inspired Dyslexia and ADHD screener results for learners showing signs
of learning barriers.

**Password gate:** The screener page requires the principal to enter their own account
password before any data is visible. This re-authentication is per browser session (stored
in `sessionStorage`). The gate uses `authApi.login()` — the same endpoint as the login page
— so it validates the real account password, not a hardcoded string.

Screener types: Dyslexia, ADHD-Inattentive, ADHD-Hyperactive, ADHD-Combined.

Risk levels: LOW, MODERATE, HIGH. HIGH-risk learners require principal review before a
note is added to the learner's record.

**Security note (known limitation):** The `sessionStorage` flag can be bypassed by a
technically skilled user via browser developer tools. Before public deployment, the unlock
state should be verified server-side on every screener data request, not just client-side.

---

## Analytics
**Route:** `/analytics`  
**Users:** All staff (summary); Principal (full)  
**Purpose:** Aggregated school-wide statistics — learner counts by grade/class/centre,
attendance rates, assessment averages, screener summary.

---

## Report Cards
**Route:** `/reports`  
**Users:** Teachers, HODs, Principal  
**Purpose:** Generate and print CAPS-formatted learner report cards.

---

## Communications
**Route:** `/communications`  
**Users:** All staff  
**Purpose:** Internal notices, announcements to parents, and messages between staff.

---

## LURITS Export
**Route:** `/lurits`  
**Users:** Principal, School Admin  
**Purpose:** Export learner data in the format required by the South African government's
Learner Unit Record Information and Tracking System (LURITS). This is the mechanism for
reporting learner data to the Department of Basic Education.

---

## Finance
**Route:** `/finance`  
**Users:** Principal only  
**Purpose:** Fee structures, payment tracking, financial summaries.

---

## HR (Human Resources)
**Route:** `/hr`  
**Users:** Principal only (hardcoded password: `EduHR@2026`)  
**Purpose:** Staff recruitment pipeline and HR record management.

Key features:
- Recruitment applications with document checklist (CV, Matric Certificate, SARS Document,
  SACE Registration, Bank Confirmation, Proof of Residence, Other Qualifications)
- Post applied for dropdown: Burgersdorp, Kgapane, Mafutsane, Pherehla-Maake, Phusela
- Subject specialisation dropdown: Mathematics, Natural Science, English, Tshivenda, Sepedi,
  Xitsonga
- File attachment per document type

**Security note:** The HR password (`EduHR@2026`) is a hardcoded string checked on the
frontend. Before public deployment this should be replaced with a proper server-side
permission check, as the password is visible in the JavaScript bundle.

---

## Users
**Route:** `/users`  
**Users:** Principal, School Admin  
**Purpose:** Create and manage staff user accounts. Assign roles.

---

## Settings
**Route:** `/settings`  
**Users:** All staff  
**Purpose:** Profile settings, notification preferences, school configuration.
