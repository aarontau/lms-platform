/**
 * Seed teacher staff members from Mopani West Education District recruitment data.
 * Source: UL-Mankweng Circuit WSP / Teacher Recruitment folder
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID = 'school-hartrog-001';

const TEACHERS = [
  // Burghersdorp
  { lastName: 'Letjeku',    initials: 'KD', idNumber: '0207300798080', school: 'Burghersdorp' },
  { lastName: 'Moloisi',    initials: 'MS', idNumber: '9403240933082', school: 'Burghersdorp' },
  { lastName: 'Peu',        initials: 'MA', idNumber: '8709240697084', school: 'Burghersdorp' },
  { lastName: 'Nkwinika',   initials: 'GN', idNumber: '9907150225081', school: 'Burghersdorp', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Shivambu',   initials: 'R',  idNumber: '9910250704088', school: 'Burghersdorp', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  // Kgapane
  { lastName: 'Maake',      initials: 'ML', idNumber: '9306021084084', school: 'Kgapane HS' },
  { lastName: 'Malematsa',  initials: 'TM', idNumber: '0107180885082', school: 'Kgapane HS' },
  { lastName: 'Raphadu',    initials: 'MC', idNumber: '9302200334085', school: 'Kgapane HS', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Rasebotsa',  initials: 'ST', idNumber: '9302060822088', school: 'Kgapane HS', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Setati',     initials: 'KP', idNumber: '9409275822082', school: 'Kgapane HS', notes: 'Copy of ID and/or other documents are not clearly legible' },
  { lastName: 'Kgahamedi',  initials: 'C',  idNumber: null,            school: 'Kgapane HS' },
  { lastName: 'Baloyi',     initials: 'R',  idNumber: '9308086168083', school: 'Kgapane HS' },
  { lastName: 'Mokalapa',   initials: 'LMY',idNumber: null,            school: 'Kgapane HS' },
  { lastName: 'Mashale',    initials: 'JM', idNumber: null,            school: 'Kgapane HS' },
  // Phusela HS
  { lastName: 'Maake',      initials: 'NM', idNumber: '8704280503086', school: 'Phusela HS', notes: 'Copy of ID and/or other documents are not clearly legible' },
  { lastName: 'Makondo',    initials: 'FP', idNumber: '9409030594083', school: 'Phusela HS' },
  { lastName: 'Malatji',    initials: 'MP', idNumber: '7201016958081', school: 'Phusela HS' },
  { lastName: 'Maphaba',    initials: 'MH', idNumber: '8709051242087', school: 'Phusela HS', notes: 'No Mathematics pass at Matric & no Mathematics major at HE' },
  { lastName: 'Mohale',     initials: 'MB', idNumber: '6608200469082', school: 'Phusela HS', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Phukubye',   initials: 'M',  idNumber: '9501046088082', school: 'Phusela HS' },
  { lastName: 'Raswiswi',   initials: 'MF', idNumber: '9191166224086', school: 'Phusela HS' },
  { lastName: 'Sephoto',    initials: 'ZM', idNumber: '9601290404082', school: 'Phusela HS', notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  // Mafutsane
  { lastName: 'Majokoja',   initials: 'PP', idNumber: '6911305569081', school: 'Mafutsane',  notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Makwela',    initials: 'MJ', idNumber: '7401315353089', school: 'Mafutsane',  notes: 'Copy of ID and/or other documents are not clearly legible' },
  { lastName: 'Mohosana',   initials: 'ML', idNumber: '8605040888081', school: 'Mafutsane',  notes: 'No Mathematics at Matric & no Mathematics major at HE' },
  { lastName: 'Mudau',      initials: 'MP', idNumber: '8410120965085', school: 'Mafutsane' },
  { lastName: 'Phalane',    initials: 'MP', idNumber: null,            school: 'Mafutsane',  notes: 'ID number outstanding' },
  // Pherehla Maake
  { lastName: 'Hlanwini',   initials: 'TM', idNumber: '6612110511082', school: 'Pherehla Maake' },
  { lastName: 'Kgatle',     initials: 'MP', idNumber: '8703010846088', school: 'Pherehla Maake' },
  { lastName: 'Magagule',   initials: 'MS', idNumber: '7609230437080', school: 'Pherehla Maake' },
  { lastName: 'Mashabane',  initials: 'KM', idNumber: '6710165577089', school: 'Pherehla Maake' },
  { lastName: 'Ramaselela', initials: 'MP', idNumber: '9911050585081', school: 'Pherehla Maake' },
  { lastName: 'Shai',       initials: 'MS', idNumber: '6709260532080', school: 'Pherehla Maake' },
];

async function main() {
  const existing = await p.staffMember.count({ where: { schoolId: SCHOOL_ID } });
  if (existing > 0) {
    console.log(`${existing} staff members already exist — checking for new entries only`);
  }

  let created = 0;
  let skipped = 0;

  for (const t of TEACHERS) {
    const alreadyExists = await p.staffMember.findFirst({
      where: {
        schoolId: SCHOOL_ID,
        lastName: t.lastName,
        initials: t.initials,
      }
    });

    if (alreadyExists) {
      console.log(`  SKIP  ${t.lastName} ${t.initials} (${t.school}) — already in DB`);
      skipped++;
      continue;
    }

    const noteText = [
      `Attached school: ${t.school}`,
      t.notes || null,
      'Source: MWED Teacher Recruitment (UL-Mankweng Circuit WSP)',
    ].filter(Boolean).join(' | ');

    await p.staffMember.create({
      data: {
        schoolId:       SCHOOL_ID,
        lastName:       t.lastName,
        firstName:      t.initials,   // only initials available from recruitment data
        initials:       t.initials,
        idNumber:       t.idNumber || null,
        gender:         'OTHER',      // update individually once confirmed
        employmentType: 'CONTRACT',
        postLevel:      'PL1',
        startDate:      new Date('2026-06-02'),
        notes:          noteText,
        isActive:       true,
      }
    });

    console.log(`  ADDED ${t.lastName} ${t.initials} — ${t.school}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
