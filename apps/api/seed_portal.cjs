/**
 * Seed parent portal users + learner-guardian links for Hartrog Academy
 * Creates:
 *   - Parent user accounts for 5 guardians with emails
 *   - LearnerGuardian records linking learners to guardians
 *   - Updates guardian.userId for portal access
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const HASH = (pw) => bcrypt.hashSync(pw, 10);
const PASSWORD = HASH('EduTrack1!');

// Guardians with emails who will get portal access
const PORTAL_GUARDIANS = [
  { guardianId: 'guardian-l-sp-1',  firstName: 'Solomon',   lastName: 'Lekganyane', email: 'sol.lek@limpopo.co.za',       userId: 'user-parent-01' },
  { guardianId: 'guardian-l-sp-3',  firstName: 'Joyce',     lastName: 'Ramokgopa',  email: 'j.ramokgopa@gmail.com',       userId: 'user-parent-02' },
  { guardianId: 'guardian-l-sp-6',  firstName: 'Jacob',     lastName: 'Nkadimeng',  email: 'j.nkadimeng@gmail.com',       userId: 'user-parent-03' },
  { guardianId: 'guardian-l-sp-8',  firstName: 'Elizabeth', lastName: 'Seshoka',    email: 'e.seshoka@webmail.co.za',     userId: 'user-parent-04' },
  { guardianId: 'guardian-l-sp-10', firstName: 'Catherine', lastName: 'Matlala',    email: 'c.matlala@gmail.com',         userId: 'user-parent-05' },
];

async function main() {
  console.log('Loading learner enrolments...');
  const enrolments = await prisma.learnerEnrolment.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: 'year-2026-hartrog' },
    select: { learnerId: true, classId: true },
    orderBy: { learnerId: 'asc' }
  });
  console.log(`  ${enrolments.length} learners`);

  // Divide learners evenly among all 30 guardians
  const allGuardians = await prisma.guardian.findMany({
    where: { schoolId: SCHOOL_ID },
    orderBy: { id: 'asc' }
  });
  console.log(`  ${allGuardians.length} guardians`);

  // ── STEP 1: Create parent user accounts ─────────────────────────────────────
  console.log('\nCreating parent user accounts...');
  let userCount = 0;
  for (const pg of PORTAL_GUARDIANS) {
    await prisma.user.upsert({
      where: { id: pg.userId },
      create: {
        id:           pg.userId,
        schoolId:     SCHOOL_ID,
        email:        pg.email,
        passwordHash: PASSWORD,
        firstName:    pg.firstName,
        lastName:     pg.lastName,
        role:         'PARENT',
        isActive:     true,
      },
      update: {}
    });
    userCount++;
  }
  console.log(`  Created ${userCount} parent user accounts`);

  // ── STEP 2: Link guardian to user ────────────────────────────────────────────
  console.log('\nLinking guardians to user accounts...');
  for (const pg of PORTAL_GUARDIANS) {
    await prisma.guardian.update({
      where: { id: pg.guardianId },
      data:  { userId: pg.userId }
    });
  }
  console.log(`  Updated ${PORTAL_GUARDIANS.length} guardian records`);

  // ── STEP 3: Create LearnerGuardian records ────────────────────────────────────
  // Distribute learners evenly: ~35 learners per guardian
  console.log('\nCreating learner-guardian links...');
  const learnerIds = enrolments.map(e => e.learnerId);
  const perGuardian = Math.ceil(learnerIds.length / allGuardians.length);

  const lgToCreate = [];
  for (let i = 0; i < allGuardians.length; i++) {
    const g = allGuardians[i];
    const slice = learnerIds.slice(i * perGuardian, (i + 1) * perGuardian);
    for (const learnerId of slice) {
      lgToCreate.push({
        schoolId:  SCHOOL_ID,
        learnerId: learnerId,
        guardianId:g.id,
        isPrimary: true,
      });
    }
  }

  const result = await prisma.learnerGuardian.createMany({
    data: lgToCreate,
    skipDuplicates: true
  });
  console.log(`  Created ${result.count} learner-guardian links`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n=== Parent Portal Setup Complete ===');
  console.log('Login credentials (password: EduTrack1!)');
  for (const pg of PORTAL_GUARDIANS) {
    const childCount = Math.min(perGuardian, learnerIds.length - PORTAL_GUARDIANS.indexOf(pg) * perGuardian);
    const idx = allGuardians.findIndex(g => g.id === pg.guardianId);
    const actualChildren = learnerIds.slice(idx * perGuardian, (idx + 1) * perGuardian).length;
    console.log(`  ${pg.email}  →  ${actualChildren} learners`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
