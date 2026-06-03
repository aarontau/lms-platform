/**
 * Reports Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   1. generateTermReports  — Create DRAFT ReportCard records for a class/term
 *   2. listReportCards      — Query report cards with filters
 *   3. getReportCard        — Full report card detail with subject SBA results
 *   4. publishReport        — Flip status DRAFT → PUBLISHED
 *   5. calculateAnnualResults — Write AnnualSubjectResult per learner/subject
 *   6. recordPromotionDecision — Write or update PromotionDecision
 *   7. getAtRiskSummary     — School-wide at-risk overview by term
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService }              from '../../prisma/prisma.service'
import { NotificationsService }       from '../notifications/notifications.service'
import { GenerateTermReportsDto }     from './dto/generate-term-report.dto'
import { CalculateAnnualResultsDto }  from './dto/calculate-annual.dto'
import { RecordPromotionDecisionDto, PromotionRecommendation } from './dto/promotion-decision.dto'
import {
  calculateAnnualResult,
  meetsSubjectMinimum,
} from '../assessment/sba-calculator'

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma:        PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── 1. Generate term report cards ─────────────────────────────────────────

  /**
   * Creates a DRAFT ReportCard for every active learner enrolled in the class
   * for the given term. Already-existing cards are left unchanged (idempotent).
   */
  async generateTermReports(schoolId: string, userId: string, dto: GenerateTermReportsDto) {
    // Validate term belongs to this school
    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, academicYear: { schoolId } },
      include: { academicYear: true },
    })
    if (!term) throw new NotFoundException('Term not found')

    // Validate class belongs to this school
    const cls = await this.prisma.class.findFirst({
      where: { id: dto.classId, schoolId },
    })
    if (!cls) throw new NotFoundException('Class not found')

    // Fetch active enrolments for this class
    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: { classId: dto.classId, status: 'ACTIVE' },
      select: { learnerId: true },
    })
    if (enrolments.length === 0) {
      return { generated: 0, skipped: 0, total: 0, message: 'No active learners found for this class' }
    }

    let generated = 0
    let skipped   = 0

    for (const { learnerId } of enrolments) {
      const existing = await this.prisma.reportCard.findFirst({
        where: {
          schoolId,
          learnerId,
          termId: dto.termId,
          reportType: 'TERM_PROGRESS',
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await this.prisma.reportCard.create({
        data: {
          schoolId,
          learnerId,
          academicYearId: term.academicYearId,
          termId:         dto.termId,
          reportType:     'TERM_PROGRESS',
          status:         'DRAFT',
        },
      })
      generated++
    }

    return { generated, skipped, total: enrolments.length }
  }

  // ── 2. List report cards ──────────────────────────────────────────────────

  async listReportCards(
    schoolId: string,
    filters: {
      termId?:         string
      classId?:        string
      academicYearId?: string
      status?:         string
      page?:           number
      limit?:          number
      search?:         string
    },
  ) {
    // If filtering by classId, get learner IDs enrolled in that class
    let learnerIdFilter: string[] | undefined

    if (filters.classId) {
      const enrolments = await this.prisma.learnerEnrolment.findMany({
        where: { classId: filters.classId, status: 'ACTIVE' },
        select: { learnerId: true },
      })
      learnerIdFilter = enrolments.map((e) => e.learnerId)
      if (learnerIdFilter.length === 0) {
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
      }
    }

    const page  = Math.max(1, filters.page  ?? 1)
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20))
    const skip  = (page - 1) * limit

    const where: any = {
      schoolId,
      ...(filters.termId         && { termId:         filters.termId         }),
      ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      ...(filters.status         && { status:         filters.status as any  }),
      ...(learnerIdFilter        && { learnerId:       { in: learnerIdFilter } }),
    }

    // Name search via learner relation
    if (filters.search) {
      const q = filters.search.trim()
      where.learner = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName:  { contains: q, mode: 'insensitive' } },
        ],
      }
    }

    // Build base where without status filter for status counts
    const whereBase: any = {
      schoolId,
      ...(filters.termId         && { termId:         filters.termId         }),
      ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      ...(learnerIdFilter        && { learnerId:       { in: learnerIdFilter } }),
    }
    if (filters.search) {
      const q = filters.search.trim()
      whereBase.learner = {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName:  { contains: q, mode: 'insensitive' } },
        ],
      }
    }

    const [total, data, statusCounts] = await Promise.all([
      this.prisma.reportCard.count({ where }),
      this.prisma.reportCard.findMany({
        where,
        include: {
          learner: {
            select: {
              id:              true,
              firstName:       true,
              lastName:        true,
              admissionNumber: true,
            },
          },
          term:        { select: { id: true, name: true, termNumber: true } },
          academicYear:{ select: { id: true, year: true } },
          publishedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [
          { term: { termNumber: 'asc' } },
          { learner: { lastName: 'asc' } },
        ],
        skip,
        take: limit,
      }),
      this.prisma.reportCard.groupBy({
        by:    ['status'],
        where: whereBase,
        _count: true,
      }),
    ])

    const publishedCount = statusCounts.find((s) => s.status === 'PUBLISHED')?._count ?? 0
    const draftCount     = statusCounts.find((s) => s.status === 'DRAFT')?._count     ?? 0

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages:    Math.ceil(total / limit),
        publishedCount,
        draftCount,
      },
    }
  }

  // ── 3. Get one report card (full detail) ──────────────────────────────────

  /**
   * Returns the report card header plus all TermSbaResult records for that
   * learner in the term — these are the subject-level marks rows.
   */
  async getReportCard(id: string, schoolId: string) {
    const card = await this.prisma.reportCard.findFirst({
      where: { id, schoolId },
      include: {
        learner: true,
        term:    true,
        academicYear: true,
        publishedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!card) throw new NotFoundException('Report card not found')

    // Fetch all subject SBA results for this learner in this term
    const sbaResults = await this.prisma.termSbaResult.findMany({
      where: {
        schoolId,
        learnerId: card.learnerId,
        termId:    card.termId ?? undefined,
      },
      include: {
        subjectClass: {
          include: {
            schoolSubject: { include: { capsSubject: true } },
          },
        },
      },
      orderBy: { subjectClass: { schoolSubject: { name: 'asc' } } },
    })

    // Fetch attendance summary for this learner in this term
    const attendanceSummary = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        schoolId,
        learnerId: card.learnerId,
        attendanceRegister: { termId: card.termId ?? undefined },
      },
      _count: true,
    })

    const attendance = {
      present: attendanceSummary.find((s) => s.status === 'PRESENT')?._count ?? 0,
      absent:  attendanceSummary.find((s) => s.status === 'ABSENT')?._count  ?? 0,
      late:    attendanceSummary.find((s) => s.status === 'LATE')?._count    ?? 0,
    }

    return { card, sbaResults, attendance }
  }

  // ── 4. Publish a report card ──────────────────────────────────────────────

  async publishReport(id: string, schoolId: string, userId: string) {
    const card = await this.prisma.reportCard.findFirst({
      where: { id, schoolId },
      include: {
        term:   { select: { name: true } },
        school: { select: { name: true } },
      },
    })
    if (!card) throw new NotFoundException('Report card not found')

    if (card.status === 'PUBLISHED') {
      throw new BadRequestException('Report card is already published')
    }

    const updated = await this.prisma.reportCard.update({
      where: { id },
      data: {
        status:        'PUBLISHED',
        publishedAt:   new Date(),
        publishedById: userId,
      },
    })

    // Fire report card notification asynchronously
    const termName   = (card as any).term?.name ?? 'Term'
    const schoolName = (card as any).school?.name ?? 'School'
    this.notifications.sendReportCardNotification({
      schoolId,
      schoolName,
      learnerId: card.learnerId,
      termName,
    }).catch((err) => console.error('Report card notification error:', err))

    return updated
  }

  // ── 5. Calculate annual results ───────────────────────────────────────────

  /**
   * For every active learner in the class, and for every subject class
   * they attend in this academic year, compute the AnnualSubjectResult
   * using the CAPS phase weights from the SBA calculator.
   */
  async calculateAnnualResults(schoolId: string, dto: CalculateAnnualResultsDto) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
      include: { terms: { select: { id: true } } },
    })
    if (!academicYear) throw new NotFoundException('Academic year not found')

    const cls = await this.prisma.class.findFirst({
      where: { id: dto.classId, schoolId },
      include: { grade: true },
    })
    if (!cls) throw new NotFoundException('Class not found')

    const gradeNumber = cls.grade?.gradeNumber ?? 8

    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: { classId: dto.classId, status: 'ACTIVE' },
      select: { learnerId: true },
    })
    if (enrolments.length === 0) {
      return { calculated: 0, learners: 0, subjects: 0 }
    }

    const subjectClasses = await this.prisma.subjectClass.findMany({
      where: { classId: dto.classId, academicYearId: dto.academicYearId, schoolId },
    })

    const termIds = academicYear.terms.map((t) => t.id)
    let calculated = 0

    for (const { learnerId } of enrolments) {
      for (const sc of subjectClasses) {
        // SBA percentages across all terms for this learner/subject
        const termResults = await this.prisma.termSbaResult.findMany({
          where: {
            schoolId,
            learnerId,
            subjectClassId: sc.id,
            termId: { in: termIds },
          },
        })
        const sbaPercentages = termResults.map((r) => Number(r.sbaTotalPercentage))

        // Find exam task and learner's mark for it
        const examTask = await this.prisma.assessmentTask.findFirst({
          where: { subjectClassId: sc.id, isExam: true, schoolId },
        })

        let examMarkRaw: number | null = null
        let examMaxMark = 100

        if (examTask) {
          const examMark = await this.prisma.learnerMark.findFirst({
            where: { assessmentTaskId: examTask.id, learnerId },
          })
          examMarkRaw = examMark?.rawMark !== null && examMark?.rawMark !== undefined
            ? Number(examMark.rawMark)
            : null
          examMaxMark = Number(examTask.maxMark)
        }

        const result = calculateAnnualResult(
          sbaPercentages,
          examMarkRaw,
          examMaxMark,
          gradeNumber,
        )

        await this.prisma.annualSubjectResult.upsert({
          where: {
            schoolId_learnerId_subjectClassId_academicYearId: {
              schoolId,
              learnerId,
              subjectClassId: sc.id,
              academicYearId: dto.academicYearId,
            },
          },
          create: {
            schoolId,
            learnerId,
            subjectClassId:  sc.id,
            academicYearId:  dto.academicYearId,
            sbaAverage:      result.sbaAverage,
            examMark:        result.examPercentage,
            finalMark:       result.finalMark,
            performanceLevel:result.performanceLevel,
            achieved:        result.achieved,
          },
          update: {
            sbaAverage:      result.sbaAverage,
            examMark:        result.examPercentage,
            finalMark:       result.finalMark,
            performanceLevel:result.performanceLevel,
            achieved:        result.achieved,
          },
        })

        calculated++
      }
    }

    return {
      calculated,
      learners:  enrolments.length,
      subjects:  subjectClasses.length,
    }
  }

  // ── 6. Record promotion decision ──────────────────────────────────────────

  async recordPromotionDecision(
    schoolId: string,
    userId:   string,
    dto:      RecordPromotionDecisionDto,
  ) {
    // Verify learner exists in school
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, schoolId },
    })
    if (!learner) throw new NotFoundException('Learner not found')

    // Verify academic year belongs to school
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    })
    if (!academicYear) throw new NotFoundException('Academic year not found')

    // Auto-calculate recommendation from annual results
    const recommendation = await this.autoCalculatePromotion(
      schoolId,
      dto.learnerId,
      dto.academicYearId,
    )

    return this.prisma.promotionDecision.upsert({
      where: {
        schoolId_learnerId_academicYearId: {
          schoolId,
          learnerId:     dto.learnerId,
          academicYearId:dto.academicYearId,
        },
      },
      create: {
        schoolId,
        learnerId:      dto.learnerId,
        academicYearId: dto.academicYearId,
        recommendation:  recommendation as any,
        finalDecision:   dto.finalDecision as any,
        isOverridden:    dto.isOverridden  ?? false,
        overrideReason:  dto.overrideReason,
        decidedById:     userId,
        decidedAt:       new Date(),
      },
      update: {
        recommendation:  recommendation as any,
        finalDecision:   dto.finalDecision as any,
        isOverridden:    dto.isOverridden  ?? false,
        overrideReason:  dto.overrideReason,
        decidedById:     userId,
        decidedAt:       new Date(),
      },
      include: {
        learner: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async listPromotionDecisions(
    schoolId:      string,
    academicYearId:string,
    classId?:      string,
  ) {
    let learnerIdFilter: string[] | undefined

    if (classId) {
      const enrolments = await this.prisma.learnerEnrolment.findMany({
        where: { classId, status: 'ACTIVE' },
        select: { learnerId: true },
      })
      learnerIdFilter = enrolments.map((e) => e.learnerId)
      if (learnerIdFilter.length === 0) return []
    }

    return this.prisma.promotionDecision.findMany({
      where: {
        schoolId,
        academicYearId,
        ...(learnerIdFilter && { learnerId: { in: learnerIdFilter } }),
      },
      include: {
        learner:    { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        decidedBy:  { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { learner: { lastName: 'asc' } },
    })
  }

  // ── 7. At-risk overview ───────────────────────────────────────────────────

  async getAtRiskSummary(schoolId: string, termId?: string) {
    return this.prisma.termSbaResult.findMany({
      where: {
        schoolId,
        isAtRisk: true,
        ...(termId && { termId }),
      },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
          },
        },
        subjectClass: {
          include: {
            schoolSubject: { select: { id: true, name: true } },
            class:         { include: { grade: true } },
          },
        },
        term: { select: { id: true, name: true, termNumber: true } },
      },
      orderBy: { sbaTotalPercentage: 'asc' },
    })
  }

  // ── Private: auto-calculate promotion recommendation ──────────────────────

  private async autoCalculatePromotion(
    schoolId:      string,
    learnerId:     string,
    academicYearId:string,
  ): Promise<PromotionRecommendation> {
    const results = await this.prisma.annualSubjectResult.findMany({
      where: { schoolId, learnerId, academicYearId },
      include: {
        subjectClass: {
          include: {
            schoolSubject: { include: { capsSubject: true } },
            class:         { include: { grade: true } },
          },
        },
      },
    })

    if (results.length === 0) return PromotionRecommendation.REPEAT

    const gradeNumber = results[0]?.subjectClass?.class?.grade?.gradeNumber ?? 8

    let failCount = 0
    for (const r of results) {
      const finalMark  = r.finalMark !== null ? Number(r.finalMark) : 0
      const capsPhase  = (r.subjectClass.schoolSubject as any)?.capsSubject?.phase ?? 'Other'
      if (!meetsSubjectMinimum(finalMark, capsPhase, gradeNumber)) {
        failCount++
      }
    }

    // CAPS pass rules (simplified: 0 fails = promote; 1–2 = progress; 3+ = repeat)
    if (failCount === 0) return PromotionRecommendation.PROMOTE
    if (failCount <= 2)  return PromotionRecommendation.PROGRESS
    return PromotionRecommendation.REPEAT
  }
}
