/**
 * Comprehensive update: SARS/tax numbers, highestQualification, new ID numbers,
 * and Sephoto ZM contact details for all 33 teacher-recruitment candidates.
 *
 * Data sourced from: scanned application bundles, qualification certificates,
 * SARS/tax lists, and CV documents read 2026-06-02.
 *
 * SARS numbers already in DB (seeded earlier):
 *   Mohosana ML (0418276176), Mudau MP (830128278), Phalane MP (0977111152),
 *   Makwela MJ (0326046158), Majokoja PP (565897170), Maake NM (3958027165),
 *   Malatji MP (1601318148), Maphaba MH (0615650181), Magagule MS (0010556165),
 *   Hlanwini TM (0242728194).
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID = 'school-hartrog-001';

// Each entry: { lastName, initials, tr (TeacherRecruitment updates), sm (StaffMember updates) }
// Omit sm entirely if no StaffMember changes needed.
const UPDATES = [
  // ── BURGHERSDORP ────────────────────────────────────────────────────────────
  {
    lastName: 'Letjeku', initials: 'KD',
    tr: {
      sarsNumber: '1601493248',
      highestQualification: 'B.Ed SP&FET, University of the Witwatersrand (2024)',
    },
  },
  {
    lastName: 'Moloisi', initials: 'MS',
    tr: {
      highestQualification: 'Professional Certificate in Education (PCE), University of Limpopo (2017)',
    },
  },
  {
    lastName: 'Peu', initials: 'MA',
    tr: {
      sarsNumber: '1661607166',
      highestQualification: 'PGCE, University of South Africa (2016)',
    },
  },
  {
    lastName: 'Nkwinika', initials: 'GN',
    tr: {
      sarsNumber: '1057406256',
      highestQualification: 'PGCE (Languages), University of Limpopo (2024)',
    },
  },
  {
    lastName: 'Shivambu', initials: 'R',
    tr: {
      sarsNumber: '2343317182',
      highestQualification: 'B.Ed, University of the Free State (2022)',
    },
  },

  // ── KGAPANE HS ──────────────────────────────────────────────────────────────
  {
    lastName: 'Maake', initials: 'ML',
    tr: {
      highestQualification: 'B.Ed Hons Educational Management, University of South Africa (2020)',
    },
  },
  {
    lastName: 'Malematsa', initials: 'TM',
    tr: {
      idNumber: '0107180885082',
      highestQualification: 'B.Ed (Mathematics & Physical Sciences), University of Limpopo (2025)',
    },
  },
  {
    lastName: 'Raphadu', initials: 'MC',
    tr: {
      idNumber: '9302200334085',
      highestQualification: 'PGCE, University of South Africa (2018)',
    },
  },
  {
    lastName: 'Rasebotsa', initials: 'ST',
    tr: {
      idNumber: '9302060822088',
      // highestQualification: only NSC found in submitted documents
    },
  },
  {
    lastName: 'Setati', initials: 'KP',
    tr: {
      idNumber: '9409275822082',
      // highestQualification: only NSC found in submitted documents
    },
  },
  {
    lastName: 'Kgahamedi', initials: 'C',
    tr: {
      highestQualification: 'PGCE, University of South Africa (2020)',
    },
  },
  // Baloyi R: no qualification documents found in submission
  {
    lastName: 'Baloyi', initials: 'R',
    tr: {},
  },
  {
    lastName: 'Mokalapa', initials: 'LMY',
    tr: {
      highestQualification: 'B.Ed Hons (Science Education), University of Limpopo (2025)',
    },
  },
  {
    lastName: 'Mashale', initials: 'JM',
    tr: {
      highestQualification: 'PGCE SP&FET, Stadio (2022)',
    },
  },

  // ── PHUSELA HS ──────────────────────────────────────────────────────────────
  {
    lastName: 'Maake', initials: 'NM',
    tr: {
      highestQualification: 'B.Ed SP&FET, University of Limpopo (2014)',
    },
  },
  {
    lastName: 'Makondo', initials: 'FP',
    tr: {
      sarsNumber: '0733791255',
      highestQualification: 'B.Ed (Mathematics & Physical Sciences), University of Venda (2022)',
    },
  },
  {
    lastName: 'Malatji', initials: 'MP',
    tr: {
      highestQualification: 'Secondary Teachers Diploma (STD), Naphuno College of Education (1997)',
    },
  },
  {
    lastName: 'Maphaba', initials: 'MH',
    tr: {
      highestQualification: 'B.Ed (English FAL & Sepedi HL), University of Venda',
    },
  },
  {
    lastName: 'Mohale', initials: 'MB',
    tr: {
      highestQualification: 'Bachelor of Arts, University of South Africa (2000)',
    },
  },
  {
    lastName: 'Phukubye', initials: 'M',
    tr: {
      sarsNumber: '0007122336',
      highestQualification: 'PGCE, University of Johannesburg',
    },
  },
  {
    lastName: 'Raswiswi', initials: 'MF',
    tr: {
      sarsNumber: '2273325163',
      highestQualification: 'B.Ed SP&FET, University of Limpopo (2015)',
    },
  },
  {
    lastName: 'Sephoto', initials: 'ZM',
    tr: {
      phone: '0760745336',
      email: 'zanelesephoto29@gmail.com',
      highestQualification: 'B.Ed, University of Limpopo (2023)',
    },
    sm: {
      phone: '0760745336',
      email: 'zanelesephoto29@gmail.com',
    },
  },

  // ── MAFUTSANE ───────────────────────────────────────────────────────────────
  {
    lastName: 'Majokoja', initials: 'PP',
    tr: {
      highestQualification: 'Secondary Teachers Diploma (STD), Modjadji College of Education (1995)',
    },
  },
  {
    lastName: 'Makwela', initials: 'MJ',
    tr: {
      highestQualification: 'National Professional Diploma in Education (NPDE), University of the Free State (2015)',
    },
  },
  {
    lastName: 'Mohosana', initials: 'ML',
    tr: {
      highestQualification: 'PGCE, University of Limpopo (2018)',
    },
  },
  {
    lastName: 'Mudau', initials: 'MP',
    tr: {
      highestQualification: 'PGCE (Mathematics & Technology), University of South Africa (2020)',
    },
  },
  {
    lastName: 'Phalane', initials: 'MP',
    tr: {
      highestQualification: 'B.Ed Hons, University of Limpopo (2010)',
    },
  },

  // ── PHEREHLA MAAKE ──────────────────────────────────────────────────────────
  {
    lastName: 'Hlanwini', initials: 'TM',
    tr: {
      highestQualification: 'Senior Teachers Diploma, Hoxani College of Education (2000)',
    },
  },
  {
    lastName: 'Kgatle', initials: 'MP',
    tr: {
      highestQualification: 'B.Ed Hons (Teacher Education and Professional Development), University of Pretoria (2021)',
    },
  },
  {
    lastName: 'Magagule', initials: 'MS',
    tr: {
      highestQualification: 'B.Ed Hons (Education Management Law & Policy), University of Pretoria (2014)',
    },
  },
  {
    lastName: 'Mashabane', initials: 'KM',
    tr: {
      highestQualification: 'B.Ed Hons (Mathematics Education), University of Johannesburg (2012)',
    },
  },
  {
    lastName: 'Ramaselela', initials: 'MP',
    tr: {
      highestQualification: 'PGCE SP&FET, Stadio (2024)',
    },
  },
  {
    lastName: 'Shai', initials: 'MS',
    tr: {
      highestQualification: 'B.Ed Hons (Educational Management), University of South Africa (2014)',
    },
  },
];

async function main() {
  let trUpdated = 0, smUpdated = 0, notFound = 0;

  for (const entry of UPDATES) {
    const { lastName, initials, tr, sm } = entry;

    // ── TeacherRecruitment ─────────────────────────────────────────────────
    const trRecord = await p.teacherRecruitment.findFirst({
      where: { schoolId: SCHOOL_ID, lastName, initials },
      select: { id: true },
    });

    if (!trRecord) {
      console.log(`  TR NOT FOUND  ${lastName} ${initials}`);
      notFound++;
    } else if (tr && Object.keys(tr).length > 0) {
      await p.teacherRecruitment.update({ where: { id: trRecord.id }, data: tr });
      const changes = Object.entries(tr).map(([k, v]) => `${k}=${v}`).join(', ');
      console.log(`  TR UPDATED  ${lastName} ${initials}  →  ${changes}`);
      trUpdated++;
    } else {
      console.log(`  TR SKIP     ${lastName} ${initials}  (nothing to update)`);
    }

    // ── StaffMember (only for entries with sm) ─────────────────────────────
    if (sm && Object.keys(sm).length > 0) {
      const smRecord = await p.staffMember.findFirst({
        where: { schoolId: SCHOOL_ID, lastName, initials },
        select: { id: true },
      });

      if (!smRecord) {
        console.log(`  SM NOT FOUND  ${lastName} ${initials}`);
        notFound++;
      } else {
        await p.staffMember.update({ where: { id: smRecord.id }, data: sm });
        const changes = Object.entries(sm).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`  SM UPDATED  ${lastName} ${initials}  →  ${changes}`);
        smUpdated++;
      }
    }
  }

  console.log(`\nDone. TR updated: ${trUpdated}, SM updated: ${smUpdated}, Not found: ${notFound}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
