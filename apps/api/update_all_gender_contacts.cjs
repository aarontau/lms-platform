/**
 * Comprehensive update: gender (derived from SA ID digits 6-9), full first names,
 * phone, email, SARS numbers, and new IDs for all 33 teacher-recruitment candidates.
 * Updates both StaffMember and TeacherRecruitment tables.
 *
 * Gender formula: ID digits at index 6-9 (0-based), value 0000-4999 = FEMALE, 5000-9999 = MALE.
 * Data sourced from: scanned CVs, Word docs, and text PDFs read 2026-06-02.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID = 'school-hartrog-001';

function genderFromId(idNumber) {
  if (!idNumber || idNumber.length < 10) return null;
  const seq = parseInt(idNumber.substring(6, 10), 10);
  if (isNaN(seq)) return null;
  return seq < 5000 ? 'FEMALE' : 'MALE';
}

// Each entry: [lastName, initials, updates_for_TeacherRecruitment, updates_for_StaffMember]
// StaffMember gender is required (non-nullable), so always set it.
// tr = TeacherRecruitment fields; sm = StaffMember fields.
// Keys omitted or null mean "leave unchanged".
const UPDATES = [
  // ── BURGHERSDORP ────────────────────────────────────────────────────────────
  {
    lastName: 'Letjeku', initials: 'KD',
    tr: { firstName: 'Karabo Doran', phone: '0673668576', email: 'karabolejeku02@gmail.com' },
    sm: { firstName: 'Karabo Doran' },
  },
  {
    lastName: 'Moloisi', initials: 'MS',
    tr: { firstName: 'Mamoraka Sandra' },
    sm: { firstName: 'Mamoraka Sandra' },
  },
  {
    lastName: 'Peu', initials: 'MA',
    tr: { firstName: 'Mmatlou Aurelia', phone: '0838585046', email: 'aureliapeu@gmail.com' },
    sm: { firstName: 'Mmatlou Aurelia' },
  },
  {
    lastName: 'Nkwinika', initials: 'GN',
    // firstName already set; just adding contact
    tr: { phone: '0607091259', email: 'gailntumbuluko23@gmail.com' },
    sm: { phone: '0607091259', email: 'gailntumbuluko23@gmail.com' },
  },
  {
    lastName: 'Shivambu', initials: 'R',
    // Correct spelling from CV: Rirhandzu (was seeded as Rikhandzu)
    tr: { firstName: 'Rirhandzu', phone: '0783007996', email: 'priscaniarhandzu@gmail.com' },
    sm: { firstName: 'Rirhandzu', phone: '0783007996', email: 'priscaniarhandzu@gmail.com' },
  },

  // ── KGAPANE HS ──────────────────────────────────────────────────────────────
  {
    lastName: 'Maake', initials: 'ML',
    tr: { firstName: 'Motlatso Lucia', phone: '0639192061', email: 'luciamaake4@gmail.com' },
    sm: { firstName: 'Motlatso Lucia', phone: '0639192061', email: 'luciamaake4@gmail.com' },
  },
  {
    lastName: 'Malematsa', initials: 'TM',
    tr: { firstName: 'Tiisetso Modjadji', phone: '0714241602', email: 'tiisetsomalematsa1807@gmail.com' },
    sm: { firstName: 'Tiisetso Modjadji', phone: '0714241602', email: 'tiisetsomalematsa1807@gmail.com' },
  },
  {
    lastName: 'Raphadu', initials: 'MC',
    // firstName already set; adding contact
    tr: {},
    sm: {},
  },
  {
    lastName: 'Rasebotsa', initials: 'ST',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Setati', initials: 'KP',
    tr: { phone: '0648466971', email: 'kgadikps@gmail.com' },
    sm: { phone: '0648466971', email: 'kgadikps@gmail.com' },
  },
  {
    lastName: 'Kgahamedi', initials: 'C',
    tr: { firstName: 'Cecilia', phone: '0794470443', email: 'kgahamedi@gmail.com', saceNumber: '122495' },
    sm: { firstName: 'Cecilia', phone: '0794470443', email: 'kgahamedi@gmail.com' },
    // No ID number → gender not computable; leave null (StaffMember requires a value — use OTHER)
    forceGender: 'OTHER',
  },
  {
    lastName: 'Baloyi', initials: 'R',
    tr: { firstName: 'Rhulani', phone: '0797197155', email: 'butirhuli2@gmail.com' },
    sm: { firstName: 'Rhulani', phone: '0797197155', email: 'butirhuli2@gmail.com' },
  },
  {
    lastName: 'Mokalapa', initials: 'LMY',
    tr: { firstName: 'Lethabo Mothakgo Yolande', idNumber: '0011110645089', phone: '0656627939', email: 'mothakgomokalapa00@gmail.com' },
    sm: { firstName: 'Lethabo Mothakgo Yolande', phone: '0656627939', email: 'mothakgomokalapa00@gmail.com' },
  },
  {
    lastName: 'Mashale', initials: 'JM',
    tr: { firstName: 'Julitha Motlatso', idNumber: '9504040650089', phone: '0726642854', email: 'julithamashale44@gmail.com' },
    sm: { firstName: 'Julitha Motlatso', phone: '0726642854', email: 'julithamashale44@gmail.com' },
  },

  // ── PHUSELA HS ──────────────────────────────────────────────────────────────
  {
    lastName: 'Maake', initials: 'NM',
    // firstName already set to 'Neptune Mahlatse'; gender was null — set from ID
    tr: {},
    sm: {},
  },
  {
    lastName: 'Makondo', initials: 'FP',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Malatji', initials: 'MP',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Maphaba', initials: 'MH',
    tr: { firstName: 'Mahlatse Heaven', sarsNumber: '0615650181' },
    sm: { firstName: 'Mahlatse Heaven' },
  },
  {
    lastName: 'Mohale', initials: 'MB',
    tr: { firstName: 'Mapotsana Baatseba', phone: '0713739775', email: 'pebetsebaatseba@gmail.com' },
    sm: { firstName: 'Mapotsana Baatseba', phone: '0713739775', email: 'pebetsebaatseba@gmail.com' },
  },
  {
    lastName: 'Phukubye', initials: 'M',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Raswiswi', initials: 'MF',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Sephoto', initials: 'ZM',
    tr: {},
    sm: {},
  },

  // ── MAFUTSANE ───────────────────────────────────────────────────────────────
  {
    lastName: 'Majokoja', initials: 'PP',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Makwela', initials: 'MJ',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Mohosana', initials: 'ML',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Mudau', initials: 'MP',
    tr: {},
    sm: {},
  },
  {
    lastName: 'Phalane', initials: 'MP',
    tr: {},
    sm: {},
  },

  // ── PHEREHLA MAAKE ──────────────────────────────────────────────────────────
  {
    lastName: 'Hlanwini', initials: 'TM',
    tr: { firstName: 'Tinyiko Mavis', phone: '0738709801', sarsNumber: '0242728194' },
    sm: { firstName: 'Tinyiko Mavis', phone: '0738709801' },
  },
  {
    lastName: 'Kgatle', initials: 'MP',
    tr: { firstName: 'Mokgadi Patience', phone: '0670999325', email: 'ramodipam@gmail.com' },
    sm: { firstName: 'Mokgadi Patience', phone: '0670999325', email: 'ramodipam@gmail.com' },
  },
  {
    lastName: 'Magagule', initials: 'MS',
    tr: { firstName: 'Mahlatsi Suzan', phone: '0828625153', email: 'magagulemahlatse@gmail.com', sarsNumber: '0010556165' },
    sm: { firstName: 'Mahlatsi Suzan', phone: '0828625153', email: 'magagulemahlatse@gmail.com' },
  },
  {
    lastName: 'Mashabane', initials: 'KM',
    tr: { firstName: 'Kennedy' },
    sm: { firstName: 'Kennedy' },
  },
  {
    lastName: 'Ramaselela', initials: 'MP',
    tr: { firstName: 'Matshidiso Pertunia', phone: '0661152480', email: 'matshidisopertunia99@gmail.com' },
    sm: { firstName: 'Matshidiso Pertunia', phone: '0661152480', email: 'matshidisopertunia99@gmail.com' },
  },
  {
    lastName: 'Shai', initials: 'MS',
    tr: {},
    sm: {},
  },
];

async function main() {
  let trUpdated = 0, smUpdated = 0, notFound = 0;

  for (const entry of UPDATES) {
    const { lastName, initials, tr, sm, forceGender } = entry;

    // ── TeacherRecruitment ─────────────────────────────────────────────────
    const trRecord = await p.teacherRecruitment.findFirst({
      where: { schoolId: SCHOOL_ID, lastName, initials },
      select: { id: true, idNumber: true, gender: true, firstName: true },
    });

    if (!trRecord) {
      console.log(`  TR NOT FOUND  ${lastName} ${initials}`);
      notFound++;
    } else {
      // Resolve the effective ID (may be updated in this entry)
      const effectiveId = tr.idNumber || trRecord.idNumber;
      const derivedGender = forceGender || genderFromId(effectiveId);
      const trData = { ...tr };
      if (derivedGender && !trRecord.gender) trData.gender = derivedGender;

      if (Object.keys(trData).length > 0) {
        await p.teacherRecruitment.update({ where: { id: trRecord.id }, data: trData });
        const changes = Object.entries(trData).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`  TR UPDATED  ${lastName} ${initials}  →  ${changes}`);
        trUpdated++;
      } else {
        // Only gender to potentially set
        if (derivedGender && !trRecord.gender) {
          await p.teacherRecruitment.update({ where: { id: trRecord.id }, data: { gender: derivedGender } });
          console.log(`  TR UPDATED  ${lastName} ${initials}  →  gender=${derivedGender}`);
          trUpdated++;
        } else {
          console.log(`  TR SKIP     ${lastName} ${initials}  (nothing new)`);
        }
      }
    }

    // ── StaffMember ────────────────────────────────────────────────────────
    const smRecord = await p.staffMember.findFirst({
      where: { schoolId: SCHOOL_ID, lastName, initials },
      select: { id: true, gender: true, firstName: true },
    });

    if (!smRecord) {
      console.log(`  SM NOT FOUND  ${lastName} ${initials}`);
      notFound++;
    } else {
      // Resolve ID from TR record for gender computation
      const trRec2 = trRecord || await p.teacherRecruitment.findFirst({
        where: { schoolId: SCHOOL_ID, lastName, initials },
        select: { idNumber: true },
      });
      const idForGender = (tr && tr.idNumber) || (trRec2 && trRec2.idNumber);
      const derivedGender = forceGender || genderFromId(idForGender);

      const smData = { ...sm };
      // StaffMember.gender is required (non-nullable) — only update if current is OTHER
      if (derivedGender && smRecord.gender === 'OTHER') smData.gender = derivedGender;

      if (Object.keys(smData).length > 0) {
        await p.staffMember.update({ where: { id: smRecord.id }, data: smData });
        const changes = Object.entries(smData).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`  SM UPDATED  ${lastName} ${initials}  →  ${changes}`);
        smUpdated++;
      } else {
        console.log(`  SM SKIP     ${lastName} ${initials}  (nothing new)`);
      }
    }
  }

  console.log(`\nDone. TR updated: ${trUpdated}, SM updated: ${smUpdated}, Not found: ${notFound}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
