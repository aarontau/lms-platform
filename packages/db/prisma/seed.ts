import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding EduTrack LMS database...')

  // ── CAPS PHASES ────────────────────────────────────────────────────────────
  const intermediate = await prisma.capsPhase.upsert({
    where: { id: 'phase-intermediate' },
    update: {},
    create: {
      id: 'phase-intermediate',
      name: 'Intermediate Phase',
      gradeFrom: 4,
      gradeTo: 6,
      sbaWeight: 75.00,
      examWeight: 25.00,
    },
  })

  const senior = await prisma.capsPhase.upsert({
    where: { id: 'phase-senior' },
    update: {},
    create: {
      id: 'phase-senior',
      name: 'Senior Phase',
      gradeFrom: 7,
      gradeTo: 9,
      sbaWeight: 60.00,
      examWeight: 40.00,
    },
  })

  const fet1011 = await prisma.capsPhase.upsert({
    where: { id: 'phase-fet-1011' },
    update: {},
    create: {
      id: 'phase-fet-1011',
      name: 'FET Phase (Gr 10-11)',
      gradeFrom: 10,
      gradeTo: 11,
      sbaWeight: 40.00,
      examWeight: 60.00,
    },
  })

  const fet12 = await prisma.capsPhase.upsert({
    where: { id: 'phase-fet-12' },
    update: {},
    create: {
      id: 'phase-fet-12',
      name: 'FET Phase (Gr 12 - NSC)',
      gradeFrom: 12,
      gradeTo: 12,
      sbaWeight: 25.00,
      examWeight: 75.00,
    },
  })

  // ── INTERMEDIATE PHASE SUBJECTS (Gr 4-6) ───────────────────────────────────
  const intermediateSubjects = [
    { code: 'HL-IP',  name: 'Home Language',                        isCompulsory: true,  group: 'Languages' },
    { code: 'FAL-IP', name: 'First Additional Language',            isCompulsory: true,  group: 'Languages' },
    { code: 'MATH-IP',name: 'Mathematics',                          isCompulsory: true,  group: 'Mathematics' },
    { code: 'NST-IP', name: 'Natural Sciences and Technology',      isCompulsory: true,  group: 'Sciences' },
    { code: 'SS-IP',  name: 'Social Sciences',                      isCompulsory: true,  group: 'Social Sciences' },
    { code: 'LS-IP',  name: 'Life Skills',                          isCompulsory: true,  group: 'Life Skills' },
  ]

  for (const subject of intermediateSubjects) {
    await prisma.capsSubject.upsert({
      where: { id: `caps-${subject.code}` },
      update: {},
      create: {
        id: `caps-${subject.code}`,
        capsPhaseId: intermediate.id,
        name: subject.name,
        code: subject.code,
        isCompulsory: subject.isCompulsory,
        subjectGroup: subject.group,
        curriculumType: 'CAPS',
      },
    })
  }

  // ── SENIOR PHASE SUBJECTS (Gr 7-9) ─────────────────────────────────────────
  const seniorSubjects = [
    { code: 'HL-SP',   name: 'Home Language',                       isCompulsory: true,  group: 'Languages' },
    { code: 'FAL-SP',  name: 'First Additional Language',           isCompulsory: true,  group: 'Languages' },
    { code: 'MATH-SP', name: 'Mathematics',                         isCompulsory: true,  group: 'Mathematics' },
    { code: 'NS-SP',   name: 'Natural Sciences',                    isCompulsory: true,  group: 'Sciences' },
    { code: 'SS-SP',   name: 'Social Sciences',                     isCompulsory: true,  group: 'Social Sciences' },
    { code: 'LO-SP',   name: 'Life Orientation',                    isCompulsory: true,  group: 'Life Orientation' },
    { code: 'TECH-SP', name: 'Technology',                          isCompulsory: true,  group: 'Technology' },
    { code: 'EMS-SP',  name: 'Economic and Management Sciences',    isCompulsory: true,  group: 'Commerce' },
    { code: 'CA-SP',   name: 'Creative Arts',                       isCompulsory: true,  group: 'Arts' },
  ]

  for (const subject of seniorSubjects) {
    await prisma.capsSubject.upsert({
      where: { id: `caps-${subject.code}` },
      update: {},
      create: {
        id: `caps-${subject.code}`,
        capsPhaseId: senior.id,
        name: subject.name,
        code: subject.code,
        isCompulsory: subject.isCompulsory,
        subjectGroup: subject.group,
        curriculumType: 'CAPS',
      },
    })
  }

  // ── SA PROVINCES ───────────────────────────────────────────────────────────
  const provinces = [
    { id: 'prov-gp', name: 'Gauteng',            code: 'GP' },
    { id: 'prov-lp', name: 'Limpopo',             code: 'LP' },
    { id: 'prov-mp', name: 'Mpumalanga',          code: 'MP' },
    { id: 'prov-nw', name: 'North West',          code: 'NW' },
    { id: 'prov-fs', name: 'Free State',          code: 'FS' },
    { id: 'prov-kzn',name: 'KwaZulu-Natal',       code: 'KZN' },
    { id: 'prov-ec', name: 'Eastern Cape',        code: 'EC' },
    { id: 'prov-wc', name: 'Western Cape',        code: 'WC' },
    { id: 'prov-nc', name: 'Northern Cape',       code: 'NC' },
  ]

  for (const province of provinces) {
    await prisma.province.upsert({
      where: { id: province.id },
      update: {},
      create: province,
    })
  }

  console.log('Seed complete.')
  console.log(`  Phases seeded:    ${[intermediate, senior, fet1011, fet12].length}`)
  console.log(`  IP subjects:      ${intermediateSubjects.length}`)
  console.log(`  SP subjects:      ${seniorSubjects.length}`)
  console.log(`  Provinces:        ${provinces.length}`)
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect())
