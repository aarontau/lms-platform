/**
 * Seed assessment data for Hartrog Academy 2026 — Term 2
 */
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

const SCHOOL_ID  = 'school-hartrog-001';
const AY_ID      = 'year-2026-hartrog';
const TERM_ID    = 'term-2-2026';

function pseudoRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

function generateMark(maxMark, mean, stdDev, seed) {
  // Simple deterministic mark using multiple samples to approximate normal dist
  const r1 = pseudoRandom(seed + 'a');
  const r2 = pseudoRandom(seed + 'b');
  const r3 = pseudoRandom(seed + 'c');
  const r4 = pseudoRandom(seed + 'd');
  // Average of 4 uniform randoms → approximately normal via CLT
  const z  = (r1 + r2 + r3 + r4 - 2) / Math.sqrt(4 / 12); // mean=2, var=4/12
  const raw = mean + z * stdDev;
  const mark = Math.round(Math.max(0, Math.min(1, raw)) * maxMark);
  return mark;
}

async function main() {
  console.log('Loading subject classes and enrolments...');

  const subjectClasses = await prisma.subjectClass.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID },
    select: { id: true, classId: true, teacherId: true, schoolSubject: { select: { name: true } } }
  });
  console.log(`  ${subjectClasses.length} subject classes`);

  const enrolments = await prisma.learnerEnrolment.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: AY_ID },
    select: { learnerId: true, classId: true }
  });
  const enrolByClass = {};
  for (const e of enrolments) {
    if (!enrolByClass[e.classId]) enrolByClass[e.classId] = [];
    enrolByClass[e.classId].push(e.learnerId);
  }
  console.log(`  ${enrolments.length} enrolments in ${Object.keys(enrolByClass).length} classes`);

  // ── STEP 1: POAs ─────────────────────────────────────────────────────────────
  console.log('\nCreating POAs...');
  const poaMap = {}; // subjectClassId → poaId
  for (const sc of subjectClasses) {
    const poa = await prisma.programmeOfAssessment.upsert({
      where: { schoolId_subjectClassId_termId: { schoolId: SCHOOL_ID, subjectClassId: sc.id, termId: TERM_ID } },
      create: {
        schoolId:           SCHOOL_ID,
        subjectClassId:     sc.id,
        termId:             TERM_ID,
        status:             'APPROVED',
        totalTasksRequired: 3,
        createdById:        sc.teacherId,
        approvedById:       sc.teacherId,
      },
      update: { status: 'APPROVED', approvedById: sc.teacherId }
    });
    poaMap[sc.id] = poa.id;
  }
  console.log(`  ${subjectClasses.length} POAs`);

  // ── STEP 2: Assessment Tasks ──────────────────────────────────────────────────
  console.log('\nCreating assessment tasks...');
  const taskDefs = [
    { title: 'Test 1',       type: 'CLASS_TEST',  maxMark: 50, weight: 40, daysAgo: 45, mean: 0.65, std: 0.12, status: 'CLOSED' },
    { title: 'Assignment 1', type: 'ASSIGNMENT',  maxMark: 30, weight: 20, daysAgo: 30, mean: 0.72, std: 0.10, status: 'CLOSED' },
    { title: 'Test 2',       type: 'CLASS_TEST',  maxMark: 50, weight: 40, daysAgo: 10, mean: 0.62, std: 0.13, status: 'CLOSED' },
  ];

  const allTaskEntries = []; // [{taskId, scId, teacherId, classId, maxMark, mean, std, weight}]
  for (const sc of subjectClasses) {
    const poaId = poaMap[sc.id];
    for (const td of taskDefs) {
      const adminDate = new Date();
      adminDate.setDate(adminDate.getDate() - td.daysAgo);

      // Check if task already exists
      let task = await prisma.assessmentTask.findFirst({
        where: { programmeOfAssessmentId: poaId, title: td.title }
      });
      if (!task) {
        task = await prisma.assessmentTask.create({
          data: {
            schoolId:               SCHOOL_ID,
            programmeOfAssessmentId:poaId,
            subjectClassId:         sc.id,
            termId:                 TERM_ID,
            title:                  td.title,
            taskType:               td.type,
            maxMark:                new Prisma.Decimal(td.maxMark),
            weightInSba:            new Prisma.Decimal(td.weight),
            dueDate:                adminDate,
            administeredDate:       adminDate,
            isExam:                 false,
            status:                 td.status,
            createdById:            sc.teacherId,
          }
        });
      }
      allTaskEntries.push({ taskId: task.id, scId: sc.id, teacherId: sc.teacherId, classId: sc.classId, maxMark: td.maxMark, mean: td.mean, std: td.std, weight: td.weight });
    }
  }
  console.log(`  ${allTaskEntries.length} assessment tasks`);

  // ── STEP 3: Learner Marks ─────────────────────────────────────────────────────
  console.log('\nCreating learner marks...');
  let markCount = 0;
  const BATCH = 500;
  const marksBuffer = [];

  for (const entry of allTaskEntries) {
    const learners = enrolByClass[entry.classId] ?? [];
    for (const learnerId of learners) {
      const seed    = learnerId + '-' + entry.taskId;
      const rawMark = generateMark(entry.maxMark, entry.mean, entry.std, seed);
      const pct     = parseFloat(((rawMark / entry.maxMark) * 100).toFixed(2));

      marksBuffer.push({
        schoolId:        SCHOOL_ID,
        assessmentTaskId:entry.taskId,
        learnerId:       learnerId,
        rawMark:         new Prisma.Decimal(rawMark),
        maxMark:         new Prisma.Decimal(entry.maxMark),
        percentage:      new Prisma.Decimal(pct),
        isAbsent:        false,
        isExempted:      false,
        capturedById:    entry.teacherId,
        capturedAt:      new Date(),
      });

      if (marksBuffer.length >= BATCH) {
        const r = await prisma.learnerMark.createMany({ data: marksBuffer.splice(0, BATCH), skipDuplicates: true });
        markCount += r.count;
        process.stdout.write(`  marks: ${markCount}\r`);
      }
    }
  }
  if (marksBuffer.length > 0) {
    const r = await prisma.learnerMark.createMany({ data: marksBuffer, skipDuplicates: true });
    markCount += r.count;
  }
  console.log(`\n  ${markCount} learner marks`);

  // ── STEP 4: SBA Results ──────────────────────────────────────────────────────
  console.log('\nComputing SBA results...');
  let sbaCount = 0;
  const sbaBuffer = [];

  // Group task entries by scId
  const tasksBySc = {};
  for (const entry of allTaskEntries) {
    if (!tasksBySc[entry.scId]) tasksBySc[entry.scId] = [];
    tasksBySc[entry.scId].push(entry);
  }

  for (const sc of subjectClasses) {
    const learners = enrolByClass[sc.classId] ?? [];
    const scTasks  = tasksBySc[sc.id] ?? [];
    const totalW   = scTasks.reduce((s, t) => s + t.weight, 0);

    for (const learnerId of learners) {
      let weightedSum = 0;
      for (const entry of scTasks) {
        const seed    = learnerId + '-' + entry.taskId;
        const rawMark = generateMark(entry.maxMark, entry.mean, entry.std, seed);
        const pct     = (rawMark / entry.maxMark) * 100;
        weightedSum  += pct * entry.weight;
      }
      const sbaPct   = totalW > 0 ? parseFloat((weightedSum / totalW).toFixed(2)) : 0;
      const isAtRisk = sbaPct < 40;

      sbaBuffer.push({
        schoolId:          SCHOOL_ID,
        learnerId:         learnerId,
        subjectClassId:    sc.id,
        termId:            TERM_ID,
        academicYearId:    AY_ID,
        sbaTotalPercentage:new Prisma.Decimal(sbaPct),
        tasksCompleted:    scTasks.length,
        tasksTotal:        scTasks.length,
        isAtRisk:          isAtRisk,
        calculatedAt:      new Date(),
      });

      if (sbaBuffer.length >= BATCH) {
        const r = await prisma.termSbaResult.createMany({ data: sbaBuffer.splice(0, BATCH), skipDuplicates: true });
        sbaCount += r.count;
        process.stdout.write(`  sba: ${sbaCount}\r`);
      }
    }
  }
  if (sbaBuffer.length > 0) {
    const r = await prisma.termSbaResult.createMany({ data: sbaBuffer, skipDuplicates: true });
    sbaCount += r.count;
  }
  console.log(`\n  ${sbaCount} SBA results`);

  // ── STEP 5: Report Cards ─────────────────────────────────────────────────────
  console.log('\nCreating report cards...');
  let rcCount = 0;
  const rcBuffer = [];
  const uniqueLearners = [...new Set(enrolments.map(e => e.learnerId))];

  for (const learnerId of uniqueLearners) {
    const rand   = pseudoRandom(learnerId + 'rc2');
    const status = rand < 0.12 ? 'PUBLISHED' : 'DRAFT';

    rcBuffer.push({
      schoolId:      SCHOOL_ID,
      learnerId:     learnerId,
      termId:        TERM_ID,
      academicYearId:AY_ID,
      reportType:    'TERM_PROGRESS',
      status:        status,
      publishedAt:   status === 'PUBLISHED' ? new Date() : null,
    });
  }

  for (let i = 0; i < rcBuffer.length; i += BATCH) {
    const r = await prisma.reportCard.createMany({ data: rcBuffer.slice(i, i + BATCH), skipDuplicates: true });
    rcCount += r.count;
  }
  console.log(`  ${rcCount} report cards (${rcBuffer.filter(r => r.status === 'PUBLISHED').length} published)`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  const atRiskCount = sbaBuffer.concat(/* already flushed */ []).filter(s => s.isAtRisk).length;
  const totalAtRisk = await prisma.termSbaResult.count({ where: { schoolId: SCHOOL_ID, termId: TERM_ID, isAtRisk: true } });
  const totalSba    = await prisma.termSbaResult.count({ where: { schoolId: SCHOOL_ID, termId: TERM_ID } });

  console.log('\n=== DONE ===');
  console.log(`At-risk learners (any subject): ${totalAtRisk} / ${totalSba} (${totalSba > 0 ? ((totalAtRisk/totalSba)*100).toFixed(1) : 0}%)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
