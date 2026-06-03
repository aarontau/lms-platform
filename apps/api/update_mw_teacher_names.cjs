/**
 * Update full first names for Mopani West teachers where CVs were text-readable.
 * 15 of 33 teachers extracted; the remaining 18 have scanned-image-only CVs.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const UPDATES = [
  // Burghersdorp
  { id: 'user-mw-t-01', firstName: 'Karabo Doran',            lastName: 'Letjeku' },
  { id: 'user-mw-t-03', firstName: 'Gail Ntumbuluko',         lastName: 'Nkwinika' },
  { id: 'user-mw-t-04', firstName: 'Mmatlou Aurelia',         lastName: 'Peu' },
  { id: 'user-mw-t-05', firstName: 'Rirhandzu',               lastName: 'Shivambu' },  // correct spelling
  // Kgapane
  { id: 'user-mw-t-06', firstName: 'Motlatso Lucia',          lastName: 'Maake' },
  { id: 'user-mw-t-07', firstName: 'Tiisetso Modjadji',       lastName: 'Malematsa' },
  { id: 'user-mw-t-08', firstName: 'Mmatsie Caron',           lastName: 'Raphadu' },
  { id: 'user-mw-t-10', firstName: 'Kgadi Peter',             lastName: 'Setati' },
  { id: 'user-mw-t-11', firstName: 'Cecilia',                 lastName: 'Kgahamedi' },
  { id: 'user-mw-t-12', firstName: 'Rhulani',                 lastName: 'Baloyi' },
  { id: 'user-mw-t-13', firstName: 'Lethabo Mothakgo Yolande',lastName: 'Mokalapa' },
  { id: 'user-mw-t-14', firstName: 'Julitha Motlatso',        lastName: 'Mashale' },
  // Pherehla-Maake
  { id: 'user-mw-t-28', firstName: 'Tinyiko Mavis',           lastName: 'Hlanwini' },
  { id: 'user-mw-t-30', firstName: 'Mahlatsi Suzan',          lastName: 'Magagule' },
  { id: 'user-mw-t-32', firstName: 'Matshidiso Pertunia',     lastName: 'Ramaselela' },
];

async function main() {
  console.log('Updating teacher first names...\n');
  for (const u of UPDATES) {
    await p.user.update({
      where: { id: u.id },
      data: { firstName: u.firstName },
    });
    console.log(`  ✓ ${u.firstName.padEnd(26)} ${u.lastName}`);
  }
  console.log(`\n══════════════════════════════════════`);
  console.log(`Updated : ${UPDATES.length} teachers`);
  console.log(`Skipped : ${33 - UPDATES.length} teachers (scanned CVs — no extractable text)`);
  console.log(`══════════════════════════════════════`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
