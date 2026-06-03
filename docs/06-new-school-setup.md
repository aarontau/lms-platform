# 06 — Setting Up for a New School

This is the step-by-step guide for deploying this platform for a different school or
organisation. The goal is that this can be done in a day by someone who understands
the project, without writing new code — only configuration.

---

## What Changes vs. What Stays the Same

### What you change:
- School name, code, district, province
- Brand colour (one line in `tailwind.config.ts`)
- Grade structure (which grades the school has)
- Class names and centre names
- Staff accounts (who the teachers, HODs, and principal are)
- Learner data (import from school records)
- HR password
- School emblem (if a custom image is provided)

### What stays exactly the same:
- All code (zero code changes needed for a basic deployment)
- Database schema
- API endpoints
- Authentication system
- All features and modules
- The DA question bank (universal content)

---

## Step 1 — Get the Code

```bash
# Clone the repository
git clone <repository-url> new-school-name
cd new-school-name

# Install dependencies for both apps
cd apps/web && npm install
cd ../api && npm install
```

---

## Step 2 — Set Up the Database

Create a new PostgreSQL database. If using a hosted service (Supabase, Neon, Railway):
- Create a new project
- Copy the connection string

```bash
# In apps/api/
cp .env.example .env
```

Edit `apps/api/.env`:
```
DATABASE_URL="postgresql://username:password@host:5432/database_name"
JWT_SECRET="generate-a-long-random-string-here"
JWT_EXPIRY="7d"
```

```bash
# Apply the database schema
npx prisma migrate deploy

# OR for a fresh development setup:
npx prisma migrate dev
```

---

## Step 3 — Customise the Seed File

Open `apps/api/prisma/seed.ts`. This file creates the initial data.

Find and update these values:

```typescript
// ── School ──────────────────────────────────────
const SCHOOL_NAME     = 'NEW SCHOOL NAME'        // ← change this
const SCHOOL_CODE     = 'NEW-CODE'               // ← change this
const SCHOOL_DISTRICT = 'District Name'          // ← change this
const SCHOOL_PROVINCE = 'Limpopo'                // ← change this (if needed)
const SCHOOL_ID       = 'school-newschool-001'   // ← change this (unique ID)

// ── Academic Year ────────────────────────────────
const YEAR_ID         = 'year-2026-newschool'    // ← change this

// ── Admin / Principal account ────────────────────
const PRINCIPAL_EMAIL    = 'principal@school.co.za'  // ← change
const PRINCIPAL_PASSWORD = 'ChangeMe@2026'            // ← change
const PRINCIPAL_FIRST    = 'First'                   // ← change
const PRINCIPAL_LAST     = 'Last'                    // ← change

// ── Grades ───────────────────────────────────────
// Add or remove grades as needed (the platform supports Grade 4 through Grade 9)
// Current setup: Grade 8 and Grade 9 only

// ── Classes ──────────────────────────────────────
// Update class names to match the new school's structure
// Format: [Centre]-[Grade][Section] e.g. 'North-8A', 'South-9B'
```

```bash
# Run the seed
npx prisma db seed
```

---

## Step 4 — Update the Brand Colour

Open `apps/web/tailwind.config.ts`. Find the `primary` colour object and replace the
colour values with the new school's brand colour.

The easiest way: go to https://uicolors.app, enter your brand hex colour, and it
generates the full scale from 50 to 950. Copy the values into `tailwind.config.ts`.

```typescript
// tailwind.config.ts
primary: {
  50:  '#fff7ed',   // ← replace all these values
  100: '#ffedd5',
  ...
  600: '#ea580c',   // ← the main brand colour
  ...
  950: '#431407',   // ← the sidebar background
}
```

Save the file. Every button, nav link, and accent in the platform updates automatically.

---

## Step 5 — Update the School Seal

The current seal uses a generic educational emblem (graduation cap, open book, gold ring).
It works for any school.

**If the new school has a specific emblem:**
1. Place the emblem image in `apps/web/public/` (e.g. `school-emblem.png`)
2. Open `apps/web/src/components/ui/SchoolSeal.tsx`
3. Replace the `<EmblemSVG />` component with an `<img>` tag pointing to the new image
4. Adjust sizing as needed

**If keeping the generic emblem:**
No changes needed. Just update the `topLabel` and `bottomLabel` wherever `<SchoolSeal>` is used.

The two places `<SchoolSeal>` is used:
- `apps/web/src/components/layout/Sidebar.tsx` — sidebar logo
- `apps/web/src/app/(dashboard)/classlists/page.tsx` — class list print header

---

## Step 6 — Configure the Frontend

```bash
# In apps/web/
cp .env.local.example .env.local
```

Edit `apps/web/.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="generate-a-different-random-string-here"
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Step 7 — Update the HR Password

The HR tab uses a hardcoded password for additional protection. Change it before deployment.

Find in `apps/web/src/app/(dashboard)/hr/page.tsx`:
```typescript
// Find this constant near the top of the file:
const HR_PASSWORD = 'EduHR@2026'   // ← change this
```

Choose a strong password and communicate it only to the principal.

---

## Step 8 — Start the Applications

```bash
# Terminal 1 — Backend API
cd apps/api
npm run start:dev

# Terminal 2 — Frontend
cd apps/web
npm run dev
```

Open http://localhost:3000 and log in with the principal account created in Step 3.

---

## Step 9 — Import Learner Data

The seed file creates the school structure but not the learners (for a real school, you
would have real learner data from existing records, not synthetic data).

**Option A: Bulk CSV import**
The platform has a bulk import feature on the Learners page. Prepare a CSV with columns:
`firstName, lastName, dateOfBirth, gender, nationality, homeLanguage, studentNumber`

**Option B: LURITS data**
If the school has a LURITS export from the previous system, it can be transformed into
the CSV format above with a simple spreadsheet conversion.

**Option C: Manual entry**
For small schools (under 100 learners), manual entry via the Add Learner form is feasible.

---

## Step 10 — Set Up Class Assignments

After learners are imported, they need to be assigned to classes.

**Option A: Bulk assignment script**
The script pattern used for MWED-BUPHEPHUKGAMA is in the project history:
`apps/api/redistribute-centers.mjs` (documented in git history).
Copy the pattern, update the class names and learner filters for the new school,
and run it once.

**Option B: Manual assignment**
If the school is smaller, learner class assignment can be done through the Learners page
(edit each learner's enrolment).

---

## Checklist for Going Live with a New School

- [ ] School name, code, district updated in seed
- [ ] Grades configured correctly
- [ ] Classes created with correct naming
- [ ] Principal account created with secure password
- [ ] Teacher accounts created (one per class, plus HODs)
- [ ] Brand colour updated
- [ ] School emblem updated (if applicable)
- [ ] HR password changed
- [ ] Learner data imported
- [ ] Learners assigned to classes
- [ ] Class lists verified in `/classlists`
- [ ] At least one DA paper previewed and printed to confirm formatting
- [ ] All staff logged in at least once and passwords changed from default

---

## What Requires Code Changes for a Fundamentally Different Use Case

If the platform is being adapted for a non-school setting (e.g. a training institute,
a community learning centre), these are the components that encode school-specific assumptions:

| Component | School-specific element | Effort to change |
|-----------|------------------------|-----------------|
| DA questions | CAPS curriculum content | Low — edit `da-questions.ts` |
| LURITS export | South African government requirement | Medium — remove or replace module |
| Screeners | ADHD/Dyslexia types | Low — add new screener types |
| Grade/Class structure | SA grade numbering | Low — seed file |
| CAPS phase references | SA curriculum framework | Medium — remove or relabel |
| Report cards | CAPS performance levels | Medium — customise template |
