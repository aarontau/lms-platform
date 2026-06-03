/**
 * Set hasMathematicsMatric and hasMathematicsMajor for teacher-recruitment candidates.
 *
 * Evidence sourced from: NSC certificates, degree transcripts, CVs, and application letters
 * read from rendered PDF images in _rendered_pages/ on 2026-06-03.
 *
 * Only updates fields where direct documentary evidence exists.
 * Teachers with no visible matric cert or transcript remain null (not updated).
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const SCHOOL_ID = 'school-hartrog-001';

// Fields: hasMathematicsMatric (boolean|undefined), hasMathematicsMajor (boolean|undefined)
// Omit a field entirely to leave it unchanged in the DB.
const UPDATES = [
  // ── BURGHERSDORP ────────────────────────────────────────────────────────────
  // Peu MA: Senior Certificate (Umalusi) shows Mathematics SG
  { lastName: 'Peu', initials: 'MA', hasMathematicsMatric: true },
  // Moloisi MS: BSc Life Sciences/Chemistry at UL; Calculus was a service module, not a major
  { lastName: 'Moloisi', initials: 'MS', hasMathematicsMajor: false },
  // Nkwinika GN: PGCE Languages (UL 2024) — no Mathematics major
  { lastName: 'Nkwinika', initials: 'GN', hasMathematicsMajor: false },

  // ── KGAPANE ─────────────────────────────────────────────────────────────────
  // Maake ML: BSc BCM (Biochemistry/Microbiology, UV) + B.Ed Hons Ed Management (UNISA) — not Mathematics
  { lastName: 'Maake', initials: 'ML', hasMathematicsMajor: false },
  // Malematsa TM: B.Ed Mathematics & Physical Sciences, UL 2025
  { lastName: 'Malematsa', initials: 'TM', hasMathematicsMajor: true },
  // Raphadu MC: NSC (Kgapane bundle) shows Agricultural subjects — no Mathematics at matric or degree level
  { lastName: 'Raphadu', initials: 'MC', hasMathematicsMatric: false, hasMathematicsMajor: false },
  // Rasebotsa ST: NSC shows Mathematical Literacy only (not Mathematics)
  { lastName: 'Rasebotsa', initials: 'ST', hasMathematicsMatric: false, hasMathematicsMajor: false },
  // Setati KP: NSC shows Mathematics 57%
  { lastName: 'Setati', initials: 'KP', hasMathematicsMatric: true },
  // Mokalapa LMY: B.Ed Hons Science Education (UL 2025) — not a Mathematics major
  { lastName: 'Mokalapa', initials: 'LMY', hasMathematicsMajor: false },

  // ── PHUSELA ─────────────────────────────────────────────────────────────────
  // Maake NM: Senior Certificate shows Mathematics SG; UL B.Ed transcript includes Methods in Maths Science & Technology
  { lastName: 'Maake', initials: 'NM', hasMathematicsMatric: true, hasMathematicsMajor: true },
  // Makondo FP: NSC Mathematics 50% Level 3 (Dec 2012); B.Ed Mathematics & Physical Sciences (UV)
  { lastName: 'Makondo', initials: 'FP', hasMathematicsMatric: true, hasMathematicsMajor: true },
  // Malatji MP: application letter states "Bachelor's Degree in Mathematics Education"; HOD Mathematical Sciences at Phusela HS
  { lastName: 'Malatji', initials: 'MP', hasMathematicsMajor: true },
  // Maphaba MH: CV lists matric subjects — Sepedi, English, Afrikaans, History, Biology, Geography, Home Economics (no Mathematics)
  { lastName: 'Maphaba', initials: 'MH', hasMathematicsMatric: false, hasMathematicsMajor: false },
  // Mohale MB: Life Science educator; BA + ACE in Education — not Mathematics focused
  { lastName: 'Mohale', initials: 'MB', hasMathematicsMajor: false },
  // Raswiswi MF: NSC Mathematics 71%; UL B.Ed transcript includes Methods in Maths Science & Technology
  { lastName: 'Raswiswi', initials: 'MF', hasMathematicsMatric: true, hasMathematicsMajor: true },

  // ── MAFUTSANE ───────────────────────────────────────────────────────────────
  // Majokoja PP: CV lists matric subjects (1993) — Sepedi, English, Economics, Mercantile Law, Business Economics, Accounting (no Mathematics)
  { lastName: 'Majokoja', initials: 'PP', hasMathematicsMatric: false, hasMathematicsMajor: false },
  // Makwela MJ: CV lists matric subjects (1992) — includes Mathematics (along with Agricultural Science, Physical Science, Biology)
  { lastName: 'Makwela', initials: 'MJ', hasMathematicsMatric: true },
  // Mudau MP: PGCE Mathematics & Technology (UNISA 2020) — Mathematics major confirmed by PGCE specialisation
  { lastName: 'Mudau', initials: 'MP', hasMathematicsMajor: true },
  // Phalane MP: B.Ed Hons Science Education (UL); transcript shows Mathematics Education 722 FAIL — not a Mathematics major
  { lastName: 'Phalane', initials: 'MP', hasMathematicsMajor: false },

  // ── PHEREHLA-MAAKE ──────────────────────────────────────────────────────────
  // Kgatle MP: B.Ed FET (UV 2013) with Maths Methodology; teaching Gr 8–12 Mathematics since 2014
  { lastName: 'Kgatle', initials: 'MP', hasMathematicsMajor: true },
  // Magagule MS: B.Ed Hons Education Management, Law and Policy (UP 2014) + ACE Science Education (NWU 2011) — not Mathematics
  { lastName: 'Magagule', initials: 'MS', hasMathematicsMajor: false },
  // Mashabane KM: Senior Certificate shows Mathematics SG (D); B.Ed Hons Mathematics Education (UJ 2012)
  { lastName: 'Mashabane', initials: 'KM', hasMathematicsMatric: true, hasMathematicsMajor: true },
  // Shai MS: B.Ed Hons Educational Management (UNISA 2014) — not Mathematics
  { lastName: 'Shai', initials: 'MS', hasMathematicsMajor: false },
];

async function main() {
  let updated = 0, notFound = 0;

  for (const entry of UPDATES) {
    const { lastName, initials, hasMathematicsMatric, hasMathematicsMajor } = entry;

    const record = await p.teacherRecruitment.findFirst({
      where: { schoolId: SCHOOL_ID, lastName, initials },
      select: { id: true },
    });

    if (!record) {
      console.log(`  NOT FOUND  ${lastName} ${initials}`);
      notFound++;
      continue;
    }

    const data = {};
    if (hasMathematicsMatric !== undefined) data.hasMathematicsMatric = hasMathematicsMatric;
    if (hasMathematicsMajor  !== undefined) data.hasMathematicsMajor  = hasMathematicsMajor;

    await p.teacherRecruitment.update({ where: { id: record.id }, data });

    const changes = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
    console.log(`  UPDATED  ${lastName} ${initials}  →  ${changes}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
