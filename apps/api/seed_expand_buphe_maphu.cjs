/**
 * Expand BuPhe and MaPhu from 2 classes per grade to 4 classes per grade.
 *
 * New classes:
 *   BuPhe-8C, BuPhe-8D, BuPhe-9C, BuPhe-9D
 *   MaPhu-8C, MaPhu-8D, MaPhu-9C, MaPhu-9D
 *
 * Approach:
 *   1. Create the 8 new class records (mirroring subject-class records from A class)
 *   2. Fetch all learner enrolments for each centre+grade, sorted alphabetically
 *   3. Split into 4 equal groups (A/B/C/D) and reassign classId
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const YEAR_ID   = 'year-2026-hartrog';

// New classes to create
const NEW_CLASSES = [
  { id: 'class-bu8C-hartrog', name: 'BuPhe-8C', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8A-hartrog' },
  { id: 'class-bu8D-hartrog', name: 'BuPhe-8D', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8A-hartrog' },
  { id: 'class-bu9C-hartrog', name: 'BuPhe-9C', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9A-hartrog' },
  { id: 'class-bu9D-hartrog', name: 'BuPhe-9D', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9A-hartrog' },
  { id: 'class-mp8C-hartrog', name: 'MaPhu-8C', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8C-hartrog' },
  { id: 'class-mp8D-hartrog', name: 'MaPhu-8D', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8C-hartrog' },
  { id: 'class-mp9C-hartrog', name: 'MaPhu-9C', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9C-hartrog' },
  { id: 'class-mp9D-hartrog', name: 'MaPhu-9D', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9C-hartrog' },
];

// Centre definitions for redistribution
const CENTRE_SCHOOLS = {
  BuPhe: ['BURGERSDORP', 'PHEREHLA-MAAKE'],
  MaPhu: ['MAFUTSANE', 'PHUSELA'],
};

// Final 4-class layout per centre per grade after expansion
const CENTRE_CLASSES = {
  BuPhe: {
    'grade-8-hartrog': ['class-8A-hartrog', 'class-8B-hartrog', 'class-bu8C-hartrog', 'class-bu8D-hartrog'],
    'grade-9-hartrog': ['class-9A-hartrog', 'class-9B-hartrog', 'class-bu9C-hartrog', 'class-bu9D-hartrog'],
  },
  MaPhu: {
    'grade-8-hartrog': ['class-8C-hartrog', 'class-8D-hartrog', 'class-mp8C-hartrog', 'class-mp8D-hartrog'],
    'grade-9-hartrog': ['class-9C-hartrog', 'class-9D-hartrog', 'class-mp9C-hartrog', 'class-mp9D-hartrog'],
  },
};

async function main() {
  // ── 1. Create new classes ──────────────────────────────────────────────────
  console.log('1. Creating new BuPhe/MaPhu C & D classes...');
  for (const c of NEW_CLASSES) {
    const srcTeacher = await p.class.findUnique({ where: { id: c.mirrorSrc }, select: { classTeacherId: true } });
    await p.class.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: {
        id:             c.id,
        schoolId:       SCHOOL_ID,
        name:           c.name,
        gradeId:        c.gradeId,
        academicYearId: YEAR_ID,
        classTeacherId: srcTeacher?.classTeacherId ?? null,
        maxCapacity:    60,
      },
    });
    console.log(`   ✓ ${c.name}`);
  }

  // ── 2. Mirror subject-class records ───────────────────────────────────────
  console.log('\n2. Mirroring subject-class records...');
  let scTotal = 0;
  for (const c of NEW_CLASSES) {
    const srcSCs = await p.subjectClass.findMany({ where: { classId: c.mirrorSrc } });
    for (const sc of srcSCs) {
      const newId = sc.id.replace(c.mirrorSrc, c.id);
      await p.subjectClass.upsert({
        where: { id: newId },
        update: {},
        create: {
          id:              newId,
          schoolId:        SCHOOL_ID,
          schoolSubjectId: sc.schoolSubjectId,
          classId:         c.id,
          academicYearId:  YEAR_ID,
          teacherId:       sc.teacherId,
        },
      });
      scTotal++;
    }
  }
  console.log(`   ✓ ${scTotal} subject-class records created`);

  // ── 3. Redistribute learner enrolments into 4 classes ─────────────────────
  console.log('\n3. Redistributing learner enrolments into 4 classes per centre per grade...');

  for (const [centre, schools] of Object.entries(CENTRE_SCHOOLS)) {
    for (const [gradeId, classIds] of Object.entries(CENTRE_CLASSES[centre])) {
      const gradeNum = gradeId.includes('8') ? 8 : 9;

      const enrolments = await p.learnerEnrolment.findMany({
        where: {
          academicYearId: YEAR_ID,
          gradeId,
          learner: { previousSchool: { in: schools } },
        },
        include: { learner: { select: { lastName: true, firstName: true } } },
        orderBy: [{ learner: { lastName: 'asc' } }, { learner: { firstName: 'asc' } }],
      });

      console.log(`   ${centre} Grade ${gradeNum}: ${enrolments.length} learners → ${classIds.join(', ')}`);

      // Split into 4 equal groups by alphabetical order
      const total = enrolments.length;
      const baseSize = Math.floor(total / 4);
      const remainder = total % 4; // first `remainder` classes get one extra learner

      let idx = 0;
      for (let slot = 0; slot < 4; slot++) {
        const slotSize = baseSize + (slot < remainder ? 1 : 0);
        const targetClassId = classIds[slot];
        for (let j = 0; j < slotSize; j++, idx++) {
          await p.learnerEnrolment.update({
            where: { id: enrolments[idx].id },
            data:  { classId: targetClassId },
          });
        }
      }

      // Report final counts
      for (const cid of classIds) {
        const count = await p.learnerEnrolment.count({ where: { classId: cid, academicYearId: YEAR_ID } });
        const cls = await p.class.findUnique({ where: { id: cid }, select: { name: true } });
        console.log(`     ${cls?.name}: ${count} learners`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('BuPhe & MaPhu expanded to 4 classes per grade. Done.');
  console.log('══════════════════════════════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
