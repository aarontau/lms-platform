/**
 * Seed Mopani West District teachers from Teacher Recruitment Excel.
 * 33 teachers across 5 schools: Burghersdorp, Kgapane, Phusela, Mafutsane, Pherehla-Maake.
 * firstName = initials (full names not available in source data).
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

const SCHOOL_ID = 'school-hartrog-001';
const PASSWORD  = bcrypt.hashSync('EduTrack1!', 10);

const TEACHERS = [
  // Burghersdorp
  { id: 'user-mw-t-01', initials: 'KD', lastName: 'Letjeku',     school: 'Burghersdorp' },
  { id: 'user-mw-t-02', initials: 'MS', lastName: 'Moloisi',     school: 'Burghersdorp' },
  { id: 'user-mw-t-03', initials: 'GN', lastName: 'Nkwinika',    school: 'Burghersdorp' },
  { id: 'user-mw-t-04', initials: 'MA', lastName: 'Peu',         school: 'Burghersdorp' },
  { id: 'user-mw-t-05', initials: 'R',  lastName: 'Shevambu',    school: 'Burghersdorp' },
  // Kgapane
  { id: 'user-mw-t-06', initials: 'ML', lastName: 'Maake',       school: 'Kgapane' },
  { id: 'user-mw-t-07', initials: 'TM', lastName: 'Malematsa',   school: 'Kgapane' },
  { id: 'user-mw-t-08', initials: 'MC', lastName: 'Raphadu',     school: 'Kgapane' },
  { id: 'user-mw-t-09', initials: 'ST', lastName: 'Rasebotsa',   school: 'Kgapane' },
  { id: 'user-mw-t-10', initials: 'KP', lastName: 'Setati',      school: 'Kgapane' },
  { id: 'user-mw-t-11', initials: 'C',  lastName: 'Kgahamedi',   school: 'Kgapane' },
  { id: 'user-mw-t-12', initials: 'R',  lastName: 'Baloyi',      school: 'Kgapane' },
  { id: 'user-mw-t-13', initials: 'LMY',lastName: 'Mokalapa',    school: 'Kgapane' },
  { id: 'user-mw-t-14', initials: 'JM', lastName: 'Mashale',     school: 'Kgapane' },
  // Phusela
  { id: 'user-mw-t-15', initials: 'NM', lastName: 'Maake',       school: 'Phusela' },
  { id: 'user-mw-t-16', initials: 'FP', lastName: 'Makondo',     school: 'Phusela' },
  { id: 'user-mw-t-17', initials: 'MP', lastName: 'Malatji',     school: 'Phusela' },
  { id: 'user-mw-t-18', initials: 'MH', lastName: 'Maphaba',     school: 'Phusela' },
  { id: 'user-mw-t-19', initials: 'MB', lastName: 'Mohale',      school: 'Phusela' },
  { id: 'user-mw-t-20', initials: 'M',  lastName: 'Phukubye',    school: 'Phusela' },
  { id: 'user-mw-t-21', initials: 'MF', lastName: 'Raswiswi',    school: 'Phusela' },
  { id: 'user-mw-t-22', initials: 'ZM', lastName: 'Sephoto',     school: 'Phusela' },
  // Mafutsane
  { id: 'user-mw-t-23', initials: 'PP', lastName: 'Majokoja',    school: 'Mafutsane' },
  { id: 'user-mw-t-24', initials: 'MJ', lastName: 'Makwela',     school: 'Mafutsane' },
  { id: 'user-mw-t-25', initials: 'ML', lastName: 'Mohosana',    school: 'Mafutsane' },
  { id: 'user-mw-t-26', initials: 'MP', lastName: 'Mudau',       school: 'Mafutsane' },
  { id: 'user-mw-t-27', initials: 'MP', lastName: 'Phalane',     school: 'Mafutsane' },
  // Pherehla-Maake
  { id: 'user-mw-t-28', initials: 'TM', lastName: 'Hlanwini',    school: 'Pherehla-Maake' },
  { id: 'user-mw-t-29', initials: 'MP', lastName: 'Kgatle',      school: 'Pherehla-Maake' },
  { id: 'user-mw-t-30', initials: 'MS', lastName: 'Magagule',    school: 'Pherehla-Maake' },
  { id: 'user-mw-t-31', initials: 'KM', lastName: 'Mashabane',   school: 'Pherehla-Maake' },
  { id: 'user-mw-t-32', initials: 'MP', lastName: 'Ramaselela',  school: 'Pherehla-Maake' },
  { id: 'user-mw-t-33', initials: 'MS', lastName: 'Shai',        school: 'Pherehla-Maake' },
];

async function main() {
  console.log('Seeding Mopani West teachers...\n');

  let created = 0;
  let skipped = 0;

  for (const t of TEACHERS) {
    const email = `${t.initials.toLowerCase()}.${t.lastName.toLowerCase()}@mwdistrict.edu`;
    await p.user.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id:           t.id,
        schoolId:     SCHOOL_ID,
        firstName:    t.initials,
        lastName:     t.lastName,
        email,
        passwordHash: PASSWORD,
        role:         'TEACHER',
        isActive:     true,
      },
    });
    console.log(`  ✓ ${t.initials} ${t.lastName.padEnd(14)} [${t.school}]  ${email}`);
    created++;
  }

  console.log('\n══════════════════════════════════════');
  console.log(`Teachers added : ${created}`);
  console.log(`Schools        : Burghersdorp (5), Kgapane (9), Phusela (8), Mafutsane (5), Pherehla-Maake (6)`);
  console.log('Default PIN    : EduTrack1!');
  console.log('══════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
