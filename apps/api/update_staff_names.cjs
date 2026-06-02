/**
 * Update StaffMember firstName and gender fields with full names
 * extracted from CVs, IDs and certificates (2026-06-02).
 * Only updates records where real names were found — leaves others untouched.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID = 'school-hartrog-001';

// [lastName, initials, firstName, gender]
const UPDATES = [
  // Burghersdorp
  ['Nkwinika',  'GN',  'Gail Ntumbuluko',  'FEMALE'],
  ['Shivambu',  'R',   'Rikhandzu',         'FEMALE'],
  // Kgapane HS
  ['Raphadu',   'MC',  'Mmatsie Caron',     'FEMALE'],
  ['Rasebotsa', 'ST',  'Sekhutlo Tumiso',   'FEMALE'],
  ['Setati',    'KP',  'Kgadi Peter',       'MALE'],
  // Phusela HS
  ['Maake',     'NM',  'Neptune Mahlatse',  null],
  ['Makondo',   'FP',  'Fikile Precious',   'FEMALE'],
  ['Malatji',   'MP',  'Peter Mokete',      'MALE'],
  ['Phukubye',  'M',   'Mahlatse',          'MALE'],
  ['Raswiswi',  'MF',  'Mpho Fanie',        'MALE'],
  ['Sephoto',   'ZM',  'Zanele Maria',      'FEMALE'],
  // Mafutsane
  ['Majokoja',  'PP',  'Phokele Patrick',   'MALE'],
  ['Makwela',   'MJ',  'Molope Joel',       'MALE'],
  ['Mohosana',  'ML',  'Mamoloko Linah',    'FEMALE'],
  ['Mudau',     'MP',  'Mokgadi Pertunia',  'FEMALE'],
  ['Phalane',   'MP',  'Mmatapa Phyllis',   'FEMALE'],
  // Pherehla Maake
  ['Shai',      'MS',  'Mapula Sarah',      'FEMALE'],
];

async function main() {
  let updated = 0, notFound = 0;

  for (const [lastName, initials, firstName, gender] of UPDATES) {
    const record = await p.staffMember.findFirst({
      where: { schoolId: SCHOOL_ID, lastName, initials },
      select: { id: true, firstName: true, gender: true },
    });

    if (!record) {
      console.log(`  NOT FOUND  ${lastName} ${initials}`);
      notFound++;
      continue;
    }

    const data = { firstName };
    if (gender) data.gender = gender;

    await p.staffMember.update({ where: { id: record.id }, data });
    console.log(`  UPDATED  ${lastName} ${initials}  →  ${firstName}${gender ? ` (${gender})` : ''}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
