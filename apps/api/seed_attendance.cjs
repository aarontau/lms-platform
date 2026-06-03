/**
 * Seed attendance registers and records for Hartrog Academy — Term 2 2026
 * Creates 30 school days (Mon–Fri) of attendance ending on 2026-05-27.
 * Attendance profile: ~87% PRESENT, 8% ABSENT, 4% LATE, 1% EXCUSED_ABSENT
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const AY_ID     = 'year-2026-hartrog';
const TERM_ID   = 'term-2-2026';

// ─── Deterministic pseudo-random from seed ────────────────────────────────────
function pseudoRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

// ─── Pick attendance status based on learner+date seed ───────────────────────
function pickStatus(learnerId, dateStr) {
  const r = pseudoRandom(`att-${learnerId}-${dateStr}`);
  // Some learners are "chronic absentees" (10% of learners)
  const isChronicAbsentee = pseudoRandom(`chronic-${learnerId}`) < 0.10;
  const absentRate = isChronicAbsentee ? 0.25 : 0.07;
  const lateRate   = isChronicAbsentee ? 0.10 : 0.04;

  if (r < absentRate) return 'ABSENT';
  if (r < absentRate + lateRate) return 'LATE';
  if (r < absentRate + lateRate + 0.01) return 'EXCUSED_ABSENT';
  return 'PRESENT';
}

// ─── Generate school days (Mon–Fri) going back from a given date ──────────────
function getSchoolDays(endDateStr, count) {
  const days = [];
  const d = new Date(endDateStr);
  d.setUTCHours(12, 0, 0, 0); // noon UTC to avoid timezone drift
  while (days.length < count) {
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      days.unshift(d.toISOString().split('T')[0]);
    }
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days;
}

async function main() {
  // End date is today (2026-05-27). Generate 30 school days ending on this date.
  const schoolDays = getSchoolDays('2026-05-27', 30);
  console.log(`  Seeding ${schoolDays.length} school days from ${schoolDays[0]} to ${schoolDays[schoolDays.length - 1]}`);

  // Load all classes for this school + year
  const classes = await prisma.class.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID },
    select: { id: true, name: true, classTeacherId: true },
  });
  console.log(`  ${classes.length} classes`);

  // Load all enrolments
  const enrolments = await prisma.learnerEnrolment.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID },
    select: { learnerId: true, classId: true },
  });
  const enrolByClass = {};
  for (const e of enrolments) {
    if (!enrolByClass[e.classId]) enrolByClass[e.classId] = [];
    enrolByClass[e.classId].push(e.learnerId);
  }
  console.log(`  ${enrolments.length} enrolments across ${Object.keys(enrolByClass).length} classes`);

  // Load teachers (for registers that don't have a class teacher)
  const teachers = await prisma.user.findMany({
    where: { schoolId: SCHOOL_ID, role: 'TEACHER', isActive: true },
    select: { id: true },
  });
  const teacherIds = teachers.map((t) => t.id);

  let totalRegisters = 0;
  let totalRecords   = 0;

  for (const cls of classes) {
    const learnerIds = enrolByClass[cls.id] ?? [];
    if (learnerIds.length === 0) continue;

    const teacherId = cls.classTeacherId ?? teacherIds[0];

    for (const dateStr of schoolDays) {
      // Use upsert to avoid duplicates if re-run
      const register = await prisma.attendanceRegister.upsert({
        where: {
          schoolId_classId_date: { schoolId: SCHOOL_ID, classId: cls.id, date: new Date(dateStr) },
        },
        create: {
          schoolId:      SCHOOL_ID,
          academicYearId: AY_ID,
          termId:        TERM_ID,
          classId:       cls.id,
          teacherId,
          date:          new Date(dateStr),
        },
        update: {},
      });
      totalRegisters++;

      // Create attendance records for each learner (skip existing)
      const recordData = learnerIds.map((learnerId) => ({
        attendanceRegisterId: register.id,
        learnerId,
        schoolId: SCHOOL_ID,
        status:   pickStatus(learnerId, dateStr),
      }));

      // createMany with skipDuplicates
      const created = await prisma.attendanceRecord.createMany({
        data:           recordData,
        skipDuplicates: true,
      });
      totalRecords += created.count;
    }

    process.stdout.write(`  Class ${cls.name}: ${learnerIds.length} learners × ${schoolDays.length} days\n`);
  }

  console.log(`\n✅ Done — ${totalRegisters} registers, ${totalRecords} records`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
