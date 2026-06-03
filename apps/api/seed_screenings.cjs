/**
 * Seed learner screening data for Hartrog Academy
 * Creates realistic DSM-5-inspired DYSLEXIA / ADHD screener records
 * for approximately 15% of active learners
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SCHOOL_ID    = 'school-hartrog-001';
const AY_ID        = 'year-2026-hartrog';
const ADMIN_USER   = 'user-teacher-1'; // teacher who administered

// ── Indicator definitions ────────────────────────────────────────────────────

const DYSLEXIA_INDICATORS = [
  { code: 'DY01', text: 'Difficulty sounding out unfamiliar words' },
  { code: 'DY02', text: 'Slow or inaccurate oral reading' },
  { code: 'DY03', text: 'Difficulty reading aloud fluently' },
  { code: 'DY04', text: 'Trouble with spelling, even familiar words' },
  { code: 'DY05', text: 'Reverses letters or numbers while writing (b/d, p/q)' },
  { code: 'DY06', text: 'Difficulty learning letter-sound correspondences' },
  { code: 'DY07', text: 'Avoids reading tasks' },
  { code: 'DY08', text: 'Poor phonological awareness' },
  { code: 'DY09', text: 'Difficulty with rhyming' },
  { code: 'DY10', text: 'Omits, substitutes or transposes words when reading' },
  { code: 'DY11', text: 'Family history of reading difficulties' },
  { code: 'DY12', text: 'Low reading comprehension relative to oral comprehension' },
  { code: 'DY13', text: 'Difficulty following multi-step written instructions' },
  { code: 'DY14', text: 'Confusion with left/right, before/after' },
  { code: 'DY15', text: 'Trouble with sequencing: alphabet, days of week, months' },
  { code: 'DY16', text: 'Written work not representative of oral capability' },
  { code: 'DY17', text: 'Slow writing speed; reluctance to write' },
  { code: 'DY18', text: 'Difficulty copying from the board accurately' },
  { code: 'DY19', text: 'Short-term memory difficulties for printed material' },
  { code: 'DY20', text: 'Difficulty with foreign language reading/spelling' },
];

const ADHD_INATTENTIVE_INDICATORS = [
  { code: 'AI01', text: 'Often fails to pay close attention to details; makes careless mistakes' },
  { code: 'AI02', text: 'Difficulty sustaining attention in tasks or activities' },
  { code: 'AI03', text: 'Does not seem to listen when spoken to directly' },
  { code: 'AI04', text: 'Does not follow through on instructions; fails to finish tasks' },
  { code: 'AI05', text: 'Difficulty organising tasks and activities' },
  { code: 'AI06', text: 'Avoids tasks requiring sustained mental effort' },
  { code: 'AI07', text: 'Frequently loses items needed for tasks' },
  { code: 'AI08', text: 'Easily distracted by extraneous stimuli' },
  { code: 'AI09', text: 'Forgetful in daily activities' },
];

const ADHD_HYPERACTIVE_INDICATORS = [
  { code: 'AH01', text: 'Fidgets or squirms in seat' },
  { code: 'AH02', text: 'Leaves seat when expected to remain seated' },
  { code: 'AH03', text: 'Runs about or climbs inappropriately' },
  { code: 'AH04', text: 'Unable to play or engage in leisure activities quietly' },
  { code: 'AH05', text: 'Often "on the go" or acts as if "driven by a motor"' },
  { code: 'AH06', text: 'Talks excessively' },
  { code: 'AH07', text: 'Blurts out answers before questions are completed' },
  { code: 'AH08', text: 'Difficulty waiting his/her turn' },
  { code: 'AH09', text: 'Interrupts or intrudes on others' },
];

const SCREENER_MAP = {
  DYSLEXIA:         DYSLEXIA_INDICATORS,
  ADHD_INATTENTIVE: ADHD_INATTENTIVE_INDICATORS,
  ADHD_HYPERACTIVE: ADHD_HYPERACTIVE_INDICATORS,
  ADHD_COMBINED:    [...ADHD_INATTENTIVE_INDICATORS, ...ADHD_HYPERACTIVE_INDICATORS],
};

// ── Risk level thresholds ────────────────────────────────────────────────────
function getRiskLevel(screenerType, totalScore, maxScore) {
  const pct = totalScore / maxScore;
  if (pct >= 0.65) return 'HIGH';
  if (pct >= 0.35) return 'MODERATE';
  return 'LOW';
}

// ── Deterministic pseudo-random ───────────────────────────────────────────────
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function seededRand(seed, min, max) {
  const x = Math.sin(seed + 1) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

// ── Score generator based on target risk ─────────────────────────────────────
function generateResponses(indicators, targetRisk, seed) {
  const n = indicators.length;
  const maxScore = n * 3;
  let avgScore;
  if (targetRisk === 'HIGH')     avgScore = 0.72 + (seed % 10) * 0.01;
  else if (targetRisk === 'MODERATE') avgScore = 0.48 + (seed % 10) * 0.01;
  else avgScore = 0.20 + (seed % 10) * 0.01;

  const target = Math.round(maxScore * avgScore);
  let remaining = target;
  const scores = [];

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      scores.push(Math.max(0, Math.min(3, remaining)));
    } else {
      const avg = remaining / (n - i);
      const s = Math.max(0, Math.min(3, Math.round(avg + seededRand(seed + i, -1, 1) * 0.5)));
      scores.push(s);
      remaining -= s;
    }
  }

  return indicators.map((ind, i) => ({
    indicatorCode: ind.code,
    indicatorText: ind.text,
    score: Math.max(0, Math.min(3, scores[i] || 0)),
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading learners...');
  const learners = await p.learner.findMany({
    where: { schoolId: SCHOOL_ID, status: 'ACTIVE' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  console.log(`  ${learners.length} active learners`);

  // Check existing screenings
  const existing = await p.learnerScreening.count({ where: { schoolId: SCHOOL_ID } });
  if (existing > 0) {
    console.log(`  ${existing} screenings already exist — skipping`);
    return;
  }

  // Select ~15% of learners for screenings (deterministic)
  const TARGET_PCT = 0.15;
  const selected = learners.filter((l, i) => {
    const h = hash(l.id + 'screen');
    return (h % 100) < (TARGET_PCT * 100);
  });
  console.log(`  ${selected.length} learners selected for screenings`);

  // Screener type distribution: 50% DYSLEXIA, 25% ADHD_INATTENTIVE, 15% ADHD_HYPERACTIVE, 10% ADHD_COMBINED
  const TYPES = ['DYSLEXIA', 'DYSLEXIA', 'ADHD_INATTENTIVE', 'ADHD_HYPERACTIVE', 'ADHD_COMBINED'];
  // Risk distribution (per screener): 55% LOW, 30% MODERATE, 15% HIGH
  const RISKS = ['LOW', 'LOW', 'LOW', 'MODERATE', 'MODERATE', 'HIGH'];

  const adminDates = [
    new Date('2026-02-15'),
    new Date('2026-02-20'),
    new Date('2026-03-05'),
    new Date('2026-03-12'),
    new Date('2026-04-10'),
  ];

  const records = [];
  for (const learner of selected) {
    const h    = hash(learner.id);
    const type = TYPES[h % TYPES.length];
    const risk = RISKS[h % RISKS.length];
    const indicators = SCREENER_MAP[type];
    const responses  = generateResponses(indicators, risk, h);
    const totalScore = responses.reduce((s, r) => s + r.score, 0);
    const maxScore   = indicators.length * 3;
    const riskLevel  = getRiskLevel(type, totalScore, maxScore);
    const adminDate  = adminDates[h % adminDates.length];

    records.push({
      schoolId:            SCHOOL_ID,
      learnerId:           learner.id,
      academicYearId:      AY_ID,
      screenerType:        type,
      administeredById:    ADMIN_USER,
      administeredAt:      adminDate,
      responses:           responses,
      totalScore:          totalScore,
      riskLevel:           riskLevel,
      teacherObservations: null,
      reviewedByPrincipal: riskLevel === 'HIGH' ? true : false,
      followUpRecommended: riskLevel === 'HIGH',
      referralStatus:      riskLevel === 'HIGH' ? 'PENDING' : null,
    });
  }

  console.log('\nCreating screening records...');
  let created = 0;
  const BATCH = 50;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await p.learnerScreening.createMany({ data: batch, skipDuplicates: true });
    created += batch.length;
    process.stdout.write(`\r  ${created}/${records.length}`);
  }

  console.log('\n\nSummary:');
  const high = records.filter(r => r.riskLevel === 'HIGH').length;
  const mod  = records.filter(r => r.riskLevel === 'MODERATE').length;
  const low  = records.filter(r => r.riskLevel === 'LOW').length;
  console.log(`  HIGH: ${high} | MODERATE: ${mod} | LOW: ${low}`);
  const byType = {};
  for (const r of records) byType[r.screenerType] = (byType[r.screenerType] || 0) + 1;
  console.log('  By type:', JSON.stringify(byType));
}

main().catch(console.error).finally(() => p.$disconnect());
