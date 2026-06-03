/**
 * Reorganise classes by centre:
 *   BuPhe   = Burghersdorp + Pherehla-Maake  → BuPhe-8A/B, BuPhe-9A/B
 *   MaPhu   = Mafutsane + Phusela            → MaPhu-8A/B, MaPhu-9A/B
 *   Kgapane = Kgapane                        → Kgapane-8A/B, Kgapane-9A/B
 *
 * Approach:
 *   1. Rename existing 8 classes to centre-prefixed names (IDs unchanged → FK relations intact)
 *   2. Create 4 new Kgapane classes
 *   3. Mirror subject-class records to the new Kgapane classes
 *   4. Redistribute all learner enrolments by previousSchool → centre, alphabetical A/B split
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const YEAR_ID   = 'year-2026-hartrog';

// ── Rename map: existing class ID → new name ──────────────────────────────────
const RENAME = [
  { id: 'class-8A-hartrog', name: 'BuPhe-8A' },
  { id: 'class-8B-hartrog', name: 'BuPhe-8B' },
  { id: 'class-8C-hartrog', name: 'MaPhu-8A' },
  { id: 'class-8D-hartrog', name: 'MaPhu-8B' },
  { id: 'class-9A-hartrog', name: 'BuPhe-9A' },
  { id: 'class-9B-hartrog', name: 'BuPhe-9B' },
  { id: 'class-9C-hartrog', name: 'MaPhu-9A' },
  { id: 'class-9D-hartrog', name: 'MaPhu-9B' },
];

// ── New Kgapane classes ───────────────────────────────────────────────────────
const NEW_CLASSES = [
  { id: 'class-kg8A-hartrog', name: 'Kgapane-8A', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8A-hartrog' },
  { id: 'class-kg8B-hartrog', name: 'Kgapane-8B', gradeId: 'grade-8-hartrog', mirrorSrc: 'class-8B-hartrog' },
  { id: 'class-kg9A-hartrog', name: 'Kgapane-9A', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9A-hartrog' },
  { id: 'class-kg9B-hartrog', name: 'Kgapane-9B', gradeId: 'grade-9-hartrog', mirrorSrc: 'class-9B-hartrog' },
];

// ── Centre school membership ──────────────────────────────────────────────────
const CENTRE_SCHOOLS = {
  BuPhe:    ['BURGERSDORP', 'PHEREHLA-MAAKE'],
  MaPhu:    ['MAFUTSANE',   'PHUSELA'],
  Kgapane:  ['KGAPANE'],
};

// Final class IDs per centre per grade after renaming + creation
const CENTRE_CLASSES = {
  BuPhe:   { 'grade-8-hartrog': ['class-8A-hartrog', 'class-8B-hartrog'],
              'grade-9-hartrog': ['class-9A-hartrog', 'class-9B-hartrog'] },
  MaPhu:   { 'grade-8-hartrog': ['class-8C-hartrog', 'class-8D-hartrog'],
              'grade-9-hartrog': ['class-9C-hartrog', 'class-9D-hartrog'] },
  Kgapane: { 'grade-8-hartrog': ['class-kg8A-hartrog', 'class-kg8B-hartrog'],
              'grade-9-hartrog': ['class-kg9A-hartrog', 'class-kg9B-hartrog'] },
};

async function main() {
  // ── 1. Rename existing classes ─────────────────────────────────────────────
  console.log('1. Renaming existing classes...');
  for (const { id, name } of RENAME) {
    await p.class.update({ where: { id }, data: { name } });
    console.log(`   ✓ ${id} → "${name}"`);
  }

  // ── 2. Create Kgapane classes ──────────────────────────────────────────────
  console.log('\n2. Creating Kgapane classes...');
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

  // ── 3. Mirror subject-class records to new Kgapane classes ────────────────
  console.log('\n3. Mirroring subject-class records...');
  let scTotal = 0;
  for (const c of NEW_CLASSES) {
    const srcSCs = await p.subjectClass.findMany({ where: { classId: c.mirrorSrc } });
    for (const sc of srcSCs) {
      const newId = sc.id.replace(c.mirrorSrc, c.id);
      await p.subjectClass.upsert({
        where: { id: newId },
        update: {},
        create: {
          id:             newId,
          schoolId:       SCHOOL_ID,
          schoolSubjectId: sc.schoolSubjectId,
          classId:        c.id,
          academicYearId: YEAR_ID,
          teacherId:      sc.teacherId,
        },
      });
      scTotal++;
    }
  }
  console.log(`   ✓ ${scTotal} subject-class records created`);

  // ── 4. Redistribute learner enrolments by centre ───────────────────────────
  console.log('\n4. Redistributing learner enrolments...');

  for (const [centre, schools] of Object.entries(CENTRE_SCHOOLS)) {
    for (const [gradeId, classIds] of Object.entries(CENTRE_CLASSES[centre])) {
      const gradeNum = gradeId.includes('8') ? 8 : 9;

      // Fetch enrolments for this centre + grade, sorted alphabetically
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

      // Split: first half → A, second half → B
      const half = Math.ceil(enrolments.length / 2);
      for (let i = 0; i < enrolments.length; i++) {
        const targetClassId = i < half ? classIds[0] : classIds[1];
        await p.learnerEnrolment.update({
          where: { id: enrolments[i].id },
          data:  { classId: targetClassId },
        });
      }

      // Report split
      for (const cid of classIds) {
        const count = await p.learnerEnrolment.count({ where: { classId: cid, academicYearId: YEAR_ID } });
        const cls = await p.class.findUnique({ where: { id: cid }, select: { name: true } });
        console.log(`     ${cls?.name}: ${count} learners`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════');
  console.log('Centre-based class reorganisation complete.');
  console.log('══════════════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
