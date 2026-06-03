/**
 * Expand Hartrog Academy from 2 to 4 classes per grade.
 * Creates 8C, 8D, 9C, 9D, adds 2 new teachers, redistributes
 * all 1053 learners evenly, and wires up subject-class records.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const YEAR_ID   = 'year-2026-hartrog';
const HASH      = pw => bcrypt.hashSync(pw, 10);
const PASSWORD  = HASH('EduTrack1!');

const NEW_TEACHERS = [
  { id: 'user-teacher-4', firstName: 'Nomsa',   lastName: 'Dlamini',  email: 'teacher4@hartrog.ac.za' },
  { id: 'user-teacher-5', firstName: 'Kagiso',  lastName: 'Modise',   email: 'teacher5@hartrog.ac.za' },
];

const NEW_CLASSES = [
  { id: 'class-8C-hartrog', name: '8C', gradeId: 'grade-8-hartrog', teacherId: 'user-teacher-4' },
  { id: 'class-8D-hartrog', name: '8D', gradeId: 'grade-8-hartrog', teacherId: 'user-teacher-5' },
  { id: 'class-9C-hartrog', name: '9C', gradeId: 'grade-9-hartrog', teacherId: 'user-teacher-4' },
  { id: 'class-9D-hartrog', name: '9D', gradeId: 'grade-9-hartrog', teacherId: 'user-teacher-5' },
];

async function main() {

  // ── 1. Create new teachers ────────────────────────────────────────────────
  console.log('Creating new teachers...');
  for (const t of NEW_TEACHERS) {
    await p.user.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id, schoolId: SCHOOL_ID,
        firstName: t.firstName, lastName: t.lastName,
        email: t.email, passwordHash: PASSWORD,
        role: 'TEACHER', isActive: true,
      }
    });
    console.log(`  ✓ ${t.firstName} ${t.lastName} (${t.email})`);
  }

  // ── 2. Create new classes ─────────────────────────────────────────────────
  console.log('\nCreating new classes...');
  for (const c of NEW_CLASSES) {
    await p.class.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id, schoolId: SCHOOL_ID,
        name: c.name, gradeId: c.gradeId,
        academicYearId: YEAR_ID,
        classTeacherId: c.teacherId,
        maxCapacity: 45,
      }
    });
    console.log(`  ✓ Class ${c.name}`);
  }

  // ── 3. Mirror subject-class records from existing classes ─────────────────
  console.log('\nCreating subject-class records for new classes...');
  const mirrors = { 'class-8C-hartrog': 'class-8A-hartrog', 'class-8D-hartrog': 'class-8B-hartrog',
                    'class-9C-hartrog': 'class-9A-hartrog', 'class-9D-hartrog': 'class-9B-hartrog' };
  let scCount = 0;
  for (const [newClassId, srcClassId] of Object.entries(mirrors)) {
    const srcSCs = await p.subjectClass.findMany({ where: { classId: srcClassId } });
    const newClass = NEW_CLASSES.find(c => c.id === newClassId);
    for (const sc of srcSCs) {
      const newScId = sc.id.replace(srcClassId.replace('class-','').replace('-hartrog',''),
                                    newClassId.replace('class-','').replace('-hartrog',''));
      await p.subjectClass.upsert({
        where: { id: newScId },
        update: {},
        create: {
          id: newScId, schoolId: SCHOOL_ID,
          schoolSubjectId: sc.schoolSubjectId,
          classId: newClassId,
          academicYearId: YEAR_ID,
          teacherId: newClass.teacherId,
        }
      });
      scCount++;
    }
  }
  console.log(`  ✓ ${scCount} subject-class records created`);

  // ── 4. Redistribute learners evenly across 4 classes per grade ───────────
  console.log('\nRedistributing learners...');

  for (const [gradeId, classIds] of [
    ['grade-8-hartrog', ['class-8A-hartrog','class-8B-hartrog','class-8C-hartrog','class-8D-hartrog']],
    ['grade-9-hartrog', ['class-9A-hartrog','class-9B-hartrog','class-9C-hartrog','class-9D-hartrog']],
  ]) {
    // Get all enrolments for this grade, sorted alphabetically by learner lastName
    const enrolments = await p.learnerEnrolment.findMany({
      where: { gradeId, academicYearId: YEAR_ID },
      include: { learner: { select: { lastName: true, firstName: true } } },
      orderBy: [{ learner: { lastName: 'asc' } }, { learner: { firstName: 'asc' } }],
    });

    console.log(`  Grade ${gradeId.includes('8') ? 8 : 9}: ${enrolments.length} learners → 4 classes`);

    for (let i = 0; i < enrolments.length; i++) {
      const targetClassId = classIds[i % 4];
      await p.learnerEnrolment.update({
        where: { id: enrolments[i].id },
        data: { classId: targetClassId },
      });
    }

    // Report final distribution
    for (const cid of classIds) {
      const count = await p.learnerEnrolment.count({ where: { classId: cid, academicYearId: YEAR_ID } });
      const name = cid.replace('class-','').replace('-hartrog','');
      console.log(`    ${name}: ${count} learners`);
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log('Classes expanded: 4 → 8');
  console.log('New teachers added: 2');
  console.log('Learners redistributed across all 8 classes');
  console.log('══════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
