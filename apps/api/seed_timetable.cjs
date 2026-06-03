/**
 * Seed timetable slots for Hartrog Academy 2026
 * Creates a realistic CAPS weekly timetable for 4 classes (8A, 8B, 9A, 9B)
 * 8 lesson periods per day × 5 days = 40 slots per class
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCHOOL_ID   = 'school-hartrog-001';
const AY_ID       = 'year-2026-hartrog';

// Venue name → id (filled in at runtime)
const VENUE_MAP   = {};
// period key "day-num" → id
const PERIOD_MAP  = {};
// subjectClass key "class-subject" → id
const SC_MAP      = {};

// Subject short codes used in timetable layout
const SUBJ = {
  ENG:  'english-fal',
  MATH: 'maths',
  NS:   'ns',
  SS:   'ss',
  GEO:  'geo',
  EMS:  'ems',
  TECH: 'tech',
  LO:   'lo',
  CA:   'ca',
  XITS: 'xitsonga-hl',
  SEPE: 'sepedi-hl',
  TSHI: 'tshivenda-hl',
};

// Venue short codes → venue names
const VENUE = {
  R8A:  'Grade 8A Classroom',
  R8B:  'Grade 8B Classroom',
  R9A:  'Grade 9A Classroom',
  R9B:  'Grade 9B Classroom',
  LAB:  'Science Laboratory',
  COMP: 'Computer Lab',
  ART:  'Art & Technology Room',
  HALL: 'Main Hall',
  SPRT: 'Sports Field',
  MUSI: 'Music Room',
};

// Venue assignment per subject per class
function venueFor(cls, subj) {
  if (subj === SUBJ.NS)   return VENUE.LAB;
  if (subj === SUBJ.TECH) return VENUE.COMP;
  if (subj === SUBJ.CA)   return VENUE.ART;
  if (subj === SUBJ.LO)   return VENUE.SPRT;
  if (cls === '8A') return VENUE.R8A;
  if (cls === '8B') return VENUE.R8B;
  if (cls === '9A') return VENUE.R9A;
  if (cls === '9B') return VENUE.R9B;
  return VENUE.R8A;
}

/**
 * Timetable layout: per class, for each day (1=Mon…5=Fri),
 * each lesson period (1-3, 5-7, 9-10) gets a subject code.
 * Lang periods (P1-Fri morning, P2-Thu) get all 3 language HLs simultaneously.
 */
// period numbers that are lessons: 1,2,3,5,6,7,9,10
// period 0=Assembly, 4=Break1, 8=Lunch — skip
const LESSON_PERIODS = [1, 2, 3, 5, 6, 7, 9, 10];

// Weekly layout for a class. Returns array of {day, periodNum, subjectCode}
// Use the same layout for all 4 classes (different classrooms, different subjectClass IDs)
function weekLayout() {
  return [
    // ── MONDAY ────────────────────────────────────────────────────────
    { day: 1, p: 1,  s: SUBJ.ENG  },
    { day: 1, p: 2,  s: SUBJ.MATH },
    { day: 1, p: 3,  s: SUBJ.NS   },
    { day: 1, p: 5,  s: SUBJ.SS   },
    { day: 1, p: 6,  s: SUBJ.ENG  },
    { day: 1, p: 7,  s: SUBJ.MATH },
    { day: 1, p: 9,  s: SUBJ.LO   },
    { day: 1, p: 10, s: SUBJ.EMS  },
    // ── TUESDAY ───────────────────────────────────────────────────────
    { day: 2, p: 1,  s: SUBJ.GEO  },
    { day: 2, p: 2,  s: SUBJ.TECH },
    { day: 2, p: 3,  s: SUBJ.CA   },
    { day: 2, p: 5,  s: SUBJ.ENG  },
    { day: 2, p: 6,  s: SUBJ.MATH },
    { day: 2, p: 7,  s: SUBJ.SS   },
    { day: 2, p: 9,  s: SUBJ.NS   },
    { day: 2, p: 10, s: SUBJ.GEO  },
    // ── WEDNESDAY ─────────────────────────────────────────────────────
    { day: 3, p: 1,  s: SUBJ.MATH },
    { day: 3, p: 2,  s: SUBJ.ENG  },
    { day: 3, p: 3,  s: SUBJ.EMS  },
    { day: 3, p: 5,  s: SUBJ.NS   },
    { day: 3, p: 6,  s: SUBJ.CA   },
    { day: 3, p: 7,  s: SUBJ.TECH },
    { day: 3, p: 9,  s: SUBJ.MATH },
    { day: 3, p: 10, s: SUBJ.ENG  },
    // ── THURSDAY ──────────────────────────────────────────────────────
    { day: 4, p: 1,  s: 'LANG'    }, // parallel: Xitsonga / Sepedi / Tshivenda
    { day: 4, p: 2,  s: SUBJ.SS   },
    { day: 4, p: 3,  s: SUBJ.MATH },
    { day: 4, p: 5,  s: SUBJ.NS   },
    { day: 4, p: 6,  s: SUBJ.ENG  },
    { day: 4, p: 7,  s: SUBJ.GEO  },
    { day: 4, p: 9,  s: SUBJ.EMS  },
    { day: 4, p: 10, s: SUBJ.TECH },
    // ── FRIDAY ────────────────────────────────────────────────────────
    { day: 5, p: 1,  s: SUBJ.CA   },
    { day: 5, p: 2,  s: 'LANG'    }, // parallel: Xitsonga / Sepedi / Tshivenda
    { day: 5, p: 3,  s: SUBJ.NS   },
    { day: 5, p: 5,  s: SUBJ.MATH },
    { day: 5, p: 6,  s: SUBJ.ENG  },
    { day: 5, p: 7,  s: SUBJ.SS   },
    { day: 5, p: 9,  s: SUBJ.GEO  },
    { day: 5, p: 10, s: SUBJ.LO   },
  ];
}

const CLASSES = ['8A', '8B', '9A', '9B'];
const LANG_SUBJECTS = [SUBJ.XITS, SUBJ.SEPE, SUBJ.TSHI];

async function main() {
  console.log('Loading periods, venues, subject classes...');

  // Load all periods
  const periods = await prisma.period.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID }
  });
  for (const p of periods) {
    PERIOD_MAP[`${p.dayOfWeek}-${p.periodNumber}`] = p.id;
  }
  console.log(`  Loaded ${periods.length} periods`);

  // Load all venues
  const venues = await prisma.venue.findMany({ where: { schoolId: SCHOOL_ID } });
  for (const v of venues) {
    VENUE_MAP[v.name] = v.id;
  }
  console.log(`  Loaded ${venues.length} venues`);

  // Load all subject classes
  const subjectClasses = await prisma.subjectClass.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID }
  });
  for (const sc of subjectClasses) {
    // ID format is sc-{classname}-{subjectcode}, e.g. sc-8A-maths
    const match = sc.id.match(/^sc-(\w+)-(.+)$/);
    if (match) {
      SC_MAP[`${match[1]}-${match[2]}`] = sc.id;
    }
  }
  console.log(`  Loaded ${subjectClasses.length} subject classes`);

  // Build timetable slot records
  const slotsToCreate = [];
  const seen = new Set(); // prevent duplicates

  for (const cls of CLASSES) {
    const layout = weekLayout();
    for (const slot of layout) {
      const periodId = PERIOD_MAP[`${slot.day}-${slot.p}`];
      if (!periodId) {
        console.warn(`  Warning: period not found for day=${slot.day} p=${slot.p}`);
        continue;
      }

      if (slot.s === 'LANG') {
        // Add all 3 language HL subjects in parallel
        for (const langSubj of LANG_SUBJECTS) {
          const scKey = `${cls}-${langSubj}`;
          const scId = SC_MAP[scKey];
          if (!scId) {
            console.warn(`  Warning: SubjectClass not found for ${scKey}`);
            continue;
          }
          const venueId = VENUE_MAP[venueFor(cls, langSubj)];
          if (!venueId) {
            console.warn(`  Warning: Venue not found for ${venueFor(cls, langSubj)}`);
            continue;
          }
          const key = `${SCHOOL_ID}-${periodId}-${scId}-${AY_ID}`;
          if (!seen.has(key)) {
            seen.add(key);
            slotsToCreate.push({ schoolId: SCHOOL_ID, periodId, subjectClassId: scId, venueId, academicYearId: AY_ID });
          }
        }
      } else {
        const scKey = `${cls}-${slot.s}`;
        const scId = SC_MAP[scKey];
        if (!scId) {
          console.warn(`  Warning: SubjectClass not found for ${scKey}`);
          continue;
        }
        const venueId = VENUE_MAP[venueFor(cls, slot.s)];
        if (!venueId) {
          console.warn(`  Warning: Venue not found for ${venueFor(cls, slot.s)}`);
          continue;
        }
        const key = `${SCHOOL_ID}-${periodId}-${scId}-${AY_ID}`;
        if (!seen.has(key)) {
          seen.add(key);
          slotsToCreate.push({ schoolId: SCHOOL_ID, periodId, subjectClassId: scId, venueId, academicYearId: AY_ID });
        }
      }
    }
  }

  console.log(`\nCreating ${slotsToCreate.length} timetable slots...`);

  // Batch insert
  let created = 0;
  const BATCH = 50;
  for (let i = 0; i < slotsToCreate.length; i += BATCH) {
    const batch = slotsToCreate.slice(i, i + BATCH);
    const result = await prisma.timetableSlot.createMany({ data: batch, skipDuplicates: true });
    created += result.count;
    process.stdout.write(`  Inserted ${Math.min(i + BATCH, slotsToCreate.length)} / ${slotsToCreate.length}\r`);
  }

  console.log(`\nDone. Created ${created} timetable slots.`);

  // Summary per class
  for (const cls of CLASSES) {
    const count = await prisma.timetableSlot.count({
      where: {
        schoolId: SCHOOL_ID,
        academicYearId: AY_ID,
        subjectClass: { classId: `class-${cls.toLowerCase()}-hartrog` }
      }
    });
    console.log(`  Class ${cls}: ${count} slots`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
