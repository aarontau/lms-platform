// Mopani West District — Grades 8 & 9 learner import
// Reads the Excel file and bulk-inserts into lms_db via Prisma

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

const EXCEL_PATH = path.join(__dirname, '..', '..', 'Mopani West Education District_Grades 8_9  Learners List.xlsx');

const SCHOOL_ID   = 'school-hartrog-001';
const YEAR_ID     = 'year-2026-hartrog';
const GRADE8_ID   = 'grade-8-hartrog';
const GRADE9_ID   = 'grade-9-hartrog';
const CLASSES = {
  '8A': 'class-8A-hartrog',
  '8B': 'class-8B-hartrog',
  '9A': 'class-9A-hartrog',
  '9B': 'class-9B-hartrog',
};

function parseSheet(wb, sheetName, grade) {
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Find the actual header row (contains 'SURNAME' or 'surname')
  let headerIdx = raw.findIndex(r => r && r.some(c => c && c.toString().toLowerCase().includes('surname')));
  if (headerIdx === -1) headerIdx = 1;

  const learners = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;
    // Columns: No, SURNAME, NAME, SCHOOL
    const surname = row[1]?.toString().trim().replace(/,$/, '');
    const name    = row[2]?.toString().trim();
    const school  = row[3]?.toString().trim() || 'MOPANI WEST';
    if (!surname || !name || surname.toLowerCase() === 'surname') continue;
    learners.push({ surname, name, school, grade });
  }
  return learners;
}

function assignClass(index, grade) {
  // Alternate between A and B classes
  return grade === 8
    ? (index % 2 === 0 ? '8A' : '8B')
    : (index % 2 === 0 ? '9A' : '9B');
}

function makeDOB(grade) {
  // Approximate birth year: Gr8 → 2012, Gr9 → 2011
  const year = grade === 8 ? 2012 : 2011;
  return new Date(`${year}-01-01`);
}

async function makeStudentNumber(grade, index) {
  return `MWD-${grade}-${String(index).padStart(4, '0')}`;
}

async function main() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(EXCEL_PATH);

  const gr8 = parseSheet(wb, 'GR8_LIST', 8);
  const gr9 = parseSheet(wb, 'GR9_LIST', 9);
  console.log(`Parsed: ${gr8.length} Grade 8, ${gr9.length} Grade 9 learners`);

  // Remove existing Mopani West learners to avoid duplicates
  const deleted = await prisma.learner.deleteMany({
    where: { previousSchool: { not: null }, schoolId: SCHOOL_ID,
             studentNumber: { startsWith: 'MWD-' } }
  });
  if (deleted.count > 0) console.log(`Removed ${deleted.count} existing Mopani West records`);

  let created = 0;
  let failed  = 0;
  const errors = [];

  const allLearners = [...gr8, ...gr9];

  for (let i = 0; i < allLearners.length; i++) {
    const { surname, name, school, grade } = allLearners[i];
    const gradeIndex = allLearners.filter((l, idx) => l.grade === grade && idx <= i).length - 1;
    const className  = assignClass(gradeIndex, grade);
    const gradeId    = grade === 8 ? GRADE8_ID : GRADE9_ID;
    const classId    = CLASSES[className];
    const studentNumber = await makeStudentNumber(grade, gradeIndex + 1);

    const learnerId  = `mwd-${grade}-${String(gradeIndex + 1).padStart(4, '0')}`;
    const enrolmentId = `enrol-${learnerId}-2026`;

    try {
      await prisma.learner.upsert({
        where: { id: learnerId },
        update: {},
        create: {
          id:             learnerId,
          firstName:      name,
          lastName:       surname,
          studentNumber,
          dateOfBirth:    makeDOB(grade),
          gender:         'OTHER',
          homeLanguage:   'Sepedi',
          nationality:    'South African',
          admissionDate:  new Date('2026-01-15'),
          previousSchool: school,
          schoolId:       SCHOOL_ID,
          status:         'ACTIVE',
          hasSpecialNeeds: false,
        }
      });

      await prisma.learnerEnrolment.upsert({
        where: { id: enrolmentId },
        update: {},
        create: {
          id:             enrolmentId,
          schoolId:       SCHOOL_ID,
          learnerId,
          academicYearId: YEAR_ID,
          gradeId,
          classId,
          enrolmentDate:  new Date('2026-01-15'),
          status:         'ACTIVE',
        }
      });

      created++;
    } catch (e) {
      failed++;
      errors.push({ row: i + 1, name: `${name} ${surname}`, error: e.message });
    }

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`  ${i + 1}/${allLearners.length} processed...\r`);
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log(`Learners created : ${created}`);
  console.log(`Failed           : ${failed}`);
  if (errors.length > 0) {
    console.log('\nFirst 5 errors:');
    errors.slice(0, 5).forEach(e => console.log(`  Row ${e.row} (${e.name}): ${e.error}`));
  }
  console.log('══════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
