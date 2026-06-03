/**
 * seed_annual.cjs
 * Calculates and seeds AnnualSubjectResult + PromotionDecision records
 * for all active learners in Hartrog Academy (2026 academic year).
 *
 * Uses the TermSbaResult records seeded by seed_assessment.cjs.
 * Generates plausible exam marks (SBA avg ± variance) for realistic data.
 *
 * Run: node seed_annual.cjs
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// Deterministic pseudorandom hash (same as other seed files)
function hash(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

// CAPS phase weights
function getWeights(gradeNumber) {
  if (gradeNumber <= 3)  return { sba: 1.00, exam: 0.00 }
  if (gradeNumber <= 6)  return { sba: 0.75, exam: 0.25 }
  if (gradeNumber <= 9)  return { sba: 0.60, exam: 0.40 }
  if (gradeNumber <= 11) return { sba: 0.40, exam: 0.60 }
  return                        { sba: 0.25, exam: 0.75 }
}

// CAPS performance level
function perfLevel(pct) {
  if (pct >= 80) return 7
  if (pct >= 70) return 6
  if (pct >= 60) return 5
  if (pct >= 50) return 4
  if (pct >= 40) return 3
  if (pct >= 30) return 2
  return 1
}

// CAPS promotion recommendation
function calcRecommendation(annualResults) {
  const failCount = annualResults.filter((r) => !r.achieved).length
  if (failCount === 0) return 'PROMOTE'
  if (failCount <= 2)  return 'PROGRESS'
  return 'REPEAT'
}

async function main() {
  // ── Fetch school, academic year, and admin user ──────────────────────────────
  const school = await p.school.findFirst()
  if (!school) { console.error('No school found'); process.exit(1) }

  const ay = await p.academicYear.findFirst({
    where: { schoolId: school.id },
    include: { terms: { select: { id: true } } },
    orderBy: { year: 'desc' },
  })
  if (!ay) { console.error('No academic year found'); process.exit(1) }

  const admin = await p.user.findFirst({
    where: { schoolId: school.id, role: { in: ['SCHOOL_ADMIN', 'PRINCIPAL'] } },
  })
  if (!admin) { console.error('No admin user found'); process.exit(1) }

  const termIds = ay.terms.map((t) => t.id)
  console.log(`School: ${school.name}, Year: ${ay.year}, Terms: ${termIds.length}`)

  // ── Get all classes with grade info ─────────────────────────────────────────
  const classes = await p.class.findMany({
    where: { schoolId: school.id },
    include: { grade: true },
  })

  let annualCreated = 0
  let promotionCreated = 0
  let skipped = 0

  for (const cls of classes) {
    const gradeNumber = cls.grade?.gradeNumber ?? 8
    const weights     = getWeights(gradeNumber)

    console.log(`\n  Class: ${cls.name} (Grade ${gradeNumber})`)

    // Get all active learners in this class
    const enrolments = await p.learnerEnrolment.findMany({
      where: { classId: cls.id, status: 'ACTIVE' },
      select: { learnerId: true },
    })

    // Get all subjectClasses for this class
    const subjectClasses = await p.subjectClass.findMany({
      where: { classId: cls.id, academicYearId: ay.id, schoolId: school.id },
      select: { id: true },
    })

    let classAnnual = 0
    let classPromo  = 0

    for (const { learnerId } of enrolments) {
      const annualResults = []

      for (const sc of subjectClasses) {
        // Get all TermSbaResults for this learner+subjectClass
        const termResults = await p.termSbaResult.findMany({
          where: { schoolId: school.id, learnerId, subjectClassId: sc.id, termId: { in: termIds } },
          select: { sbaTotalPercentage: true },
        })

        if (termResults.length === 0) continue

        const sbaAverage = termResults.reduce(
          (sum, r) => sum + Number(r.sbaTotalPercentage), 0
        ) / termResults.length

        // Simulated exam mark: SBA avg ± deterministic variance (±15%)
        const rnd         = hash(`${learnerId}-${sc.id}-exam`) * 2 - 1   // -1..+1
        const examPct     = Math.max(5, Math.min(100, sbaAverage + rnd * 15))
        const examMark    = weights.exam > 0 ? examPct : null

        // Final mark
        const examComponent = weights.exam > 0 ? (examPct * weights.exam) : 0
        const finalMark     = Math.round((sbaAverage * weights.sba + examComponent) * 100) / 100
        const level         = perfLevel(finalMark)
        const achieved      = finalMark >= 40

        // Check if exists
        const existing = await p.annualSubjectResult.findUnique({
          where: {
            schoolId_learnerId_subjectClassId_academicYearId: {
              schoolId: school.id, learnerId, subjectClassId: sc.id, academicYearId: ay.id,
            },
          },
        })

        if (!existing) {
          await p.annualSubjectResult.create({
            data: {
              schoolId:        school.id,
              learnerId,
              subjectClassId:  sc.id,
              academicYearId:  ay.id,
              sbaAverage:      Math.round(sbaAverage * 100) / 100,
              examMark:        examMark !== null ? Math.round(examMark * 100) / 100 : undefined,
              finalMark,
              performanceLevel: level,
              achieved,
            },
          })
          classAnnual++
        } else {
          skipped++
        }

        annualResults.push({ achieved, finalMark })
      }

      // Create PromotionDecision for this learner
      if (annualResults.length > 0) {
        const recommendation = calcRecommendation(annualResults)

        const existingPromo = await p.promotionDecision.findUnique({
          where: {
            schoolId_learnerId_academicYearId: {
              schoolId: school.id, learnerId, academicYearId: ay.id,
            },
          },
        })

        if (!existingPromo) {
          await p.promotionDecision.create({
            data: {
              schoolId:       school.id,
              learnerId,
              academicYearId: ay.id,
              recommendation,
              finalDecision:  recommendation,
              isOverridden:   false,
              decidedById:    admin.id,
              decidedAt:      new Date(),
            },
          })
          classPromo++
        }
      }
    }

    annualCreated    += classAnnual
    promotionCreated += classPromo
    console.log(`    ✓ ${classAnnual} annual results, ${classPromo} promotion decisions`)
  }

  console.log('\n══════════════════════════════════════')
  console.log(`Annual Subject Results: ${annualCreated} created (${skipped} already existed)`)
  console.log(`Promotion Decisions:    ${promotionCreated} created`)
  console.log('══════════════════════════════════════')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
