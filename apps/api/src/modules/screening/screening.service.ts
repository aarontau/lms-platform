import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

// ─── DSM-5-inspired indicator definitions ────────────────────────────────────

export const DYSLEXIA_INDICATORS = [
  { code: 'DX_01', text: 'Difficulty decoding words (sounding out unfamiliar words)' },
  { code: 'DX_02', text: 'Slow and laboured oral reading' },
  { code: 'DX_03', text: 'Frequent reading errors: substitutions, omissions, distortions' },
  { code: 'DX_04', text: 'Difficulty with reading fluency and automaticity' },
  { code: 'DX_05', text: 'Poor phonological awareness (rhyming, segmenting, blending)' },
  { code: 'DX_06', text: 'Struggles with spelling: phonetically irregular words' },
  { code: 'DX_07', text: 'Slow or effortful handwriting / letter reversal' },
  { code: 'DX_08', text: 'Avoids or dislikes reading activities' },
  { code: 'DX_09', text: 'Significant gap between listening comprehension and reading comprehension' },
  { code: 'DX_10', text: 'Difficulty remembering sequences (alphabet, months, multiplication tables)' },
]

export const ADHD_INATTENTIVE_INDICATORS = [
  { code: 'AI_01', text: 'Fails to give close attention to detail or makes careless mistakes' },
  { code: 'AI_02', text: 'Often has difficulty sustaining attention in tasks or play' },
  { code: 'AI_03', text: 'Seems to not listen when spoken to directly' },
  { code: 'AI_04', text: 'Often does not follow through on instructions or fails to finish tasks' },
  { code: 'AI_05', text: 'Has difficulty organising tasks and activities' },
  { code: 'AI_06', text: 'Avoids tasks that require sustained mental effort' },
  { code: 'AI_07', text: 'Frequently loses items necessary for tasks (pencils, books)' },
  { code: 'AI_08', text: 'Easily distracted by extraneous stimuli' },
  { code: 'AI_09', text: 'Often forgetful in daily activities' },
]

export const ADHD_HYPERACTIVE_INDICATORS = [
  { code: 'AH_01', text: 'Often fidgets or squirms in seat' },
  { code: 'AH_02', text: 'Leaves seat when remaining seated is expected' },
  { code: 'AH_03', text: 'Runs or climbs excessively in situations where it is inappropriate' },
  { code: 'AH_04', text: 'Unable to play or engage in leisure activities quietly' },
  { code: 'AH_05', text: 'Often acts as if "driven by a motor"; always on the go' },
  { code: 'AH_06', text: 'Talks excessively' },
  { code: 'AH_07', text: 'Blurts out answers before questions have been completed' },
  { code: 'AH_08', text: 'Difficulty waiting for a turn' },
  { code: 'AH_09', text: 'Interrupts or intrudes on others' },
]

export const ADHD_COMBINED_INDICATORS = [
  ...ADHD_INATTENTIVE_INDICATORS,
  ...ADHD_HYPERACTIVE_INDICATORS,
]

export type ScreenerType = 'DYSLEXIA' | 'ADHD_INATTENTIVE' | 'ADHD_HYPERACTIVE' | 'ADHD_COMBINED'

/**
 * Compute risk level based on score thresholds:
 * Dyslexia (10 items × 3 max = 30):  LOW <10 | MODERATE 10-19 | HIGH ≥20
 * ADHD Inattentive (9 items × 3 = 27): LOW <9  | MODERATE 9-17  | HIGH ≥18
 * ADHD Hyperactive (9 items × 3 = 27): LOW <9  | MODERATE 9-17  | HIGH ≥18
 * ADHD Combined   (18 items × 3 = 54): LOW <18 | MODERATE 18-35 | HIGH ≥36
 */
function computeRiskLevel(type: ScreenerType, score: number): 'LOW' | 'MODERATE' | 'HIGH' {
  if (type === 'DYSLEXIA') {
    if (score >= 20) return 'HIGH'
    if (score >= 10) return 'MODERATE'
    return 'LOW'
  }
  if (type === 'ADHD_COMBINED') {
    if (score >= 36) return 'HIGH'
    if (score >= 18) return 'MODERATE'
    return 'LOW'
  }
  // INATTENTIVE or HYPERACTIVE
  if (score >= 18) return 'HIGH'
  if (score >= 9) return 'MODERATE'
  return 'LOW'
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface ScreeningResponseItem {
  indicatorCode: string
  indicatorText: string
  /** 0 = Never, 1 = Sometimes, 2 = Often, 3 = Very Often */
  score: number
}

export interface SubmitScreeningDto {
  learnerId: string
  academicYearId: string
  screenerType: ScreenerType
  responses: ScreeningResponseItem[]
  teacherObservations?: string
}

export interface ReviewScreeningDto {
  principalNotes?: string
  followUpRecommended: boolean
  referralStatus?: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ScreeningService {
  constructor(private readonly prisma: PrismaService) {}

  /** Return indicator definitions for a given screener type. */
  getIndicators(type: ScreenerType) {
    switch (type) {
      case 'DYSLEXIA':        return DYSLEXIA_INDICATORS
      case 'ADHD_INATTENTIVE': return ADHD_INATTENTIVE_INDICATORS
      case 'ADHD_HYPERACTIVE': return ADHD_HYPERACTIVE_INDICATORS
      case 'ADHD_COMBINED':    return ADHD_COMBINED_INDICATORS
    }
  }

  /** Submit a completed screener for a learner. */
  async submitScreening(schoolId: string, userId: string, dto: SubmitScreeningDto) {
    const totalScore = dto.responses.reduce((sum, r) => sum + (r.score ?? 0), 0)
    const riskLevel  = computeRiskLevel(dto.screenerType, totalScore)

    return this.prisma.learnerScreening.create({
      data: {
        schoolId,
        learnerId:       dto.learnerId,
        academicYearId:  dto.academicYearId,
        screenerType:    dto.screenerType as any,
        administeredById: userId,
        administeredAt:  new Date(),
        responses:       dto.responses as any,
        totalScore,
        riskLevel:       riskLevel as any,
        teacherObservations: dto.teacherObservations,
      },
      include: {
        learner:        { select: { firstName: true, lastName: true, studentNumber: true } },
        administeredBy: { select: { firstName: true, lastName: true } },
      },
    })
  }

  /** List all screenings for the school (Principal: all; Teacher: own administered). */
  async listScreenings(
    schoolId: string,
    userId: string,
    role: string,
    filters: {
      learnerId?: string
      screenerType?: string
      riskLevel?: string
      reviewedByPrincipal?: boolean
      academicYearId?: string
    },
  ) {
    const where: any = { schoolId }
    if (role === 'TEACHER') where.administeredById = userId
    if (filters.learnerId)           where.learnerId      = filters.learnerId
    if (filters.screenerType)        where.screenerType   = filters.screenerType
    if (filters.riskLevel)           where.riskLevel      = filters.riskLevel
    if (filters.academicYearId)      where.academicYearId = filters.academicYearId
    if (filters.reviewedByPrincipal !== undefined)
      where.reviewedByPrincipal = filters.reviewedByPrincipal

    return this.prisma.learnerScreening.findMany({
      where,
      orderBy: { administeredAt: 'desc' },
      include: {
        learner:        { select: { firstName: true, lastName: true, studentNumber: true } },
        administeredBy: { select: { firstName: true, lastName: true, role: true } },
        reviewedBy:     { select: { firstName: true, lastName: true } },
      },
    })
  }

  /** Get a single screening record with full responses. */
  async getScreening(id: string, schoolId: string) {
    const screening = await this.prisma.learnerScreening.findFirst({
      where: { id, schoolId },
      include: {
        learner:        true,
        administeredBy: { select: { firstName: true, lastName: true, role: true } },
        reviewedBy:     { select: { firstName: true, lastName: true } },
        academicYear:   { select: { year: true } },
      },
    })
    if (!screening) throw new NotFoundException('Screening not found')
    return screening
  }

  /** Principal reviews a screening result and records notes / follow-up. */
  async reviewScreening(
    id: string,
    schoolId: string,
    reviewedById: string,
    dto: ReviewScreeningDto,
  ) {
    const existing = await this.prisma.learnerScreening.findFirst({
      where: { id, schoolId },
    })
    if (!existing) throw new NotFoundException('Screening not found')

    return this.prisma.learnerScreening.update({
      where: { id },
      data: {
        reviewedByPrincipal: true,
        reviewedById,
        reviewedAt:          new Date(),
        principalNotes:      dto.principalNotes,
        followUpRecommended: dto.followUpRecommended,
        referralStatus:      dto.referralStatus,
      },
      include: {
        learner:    { select: { firstName: true, lastName: true, studentNumber: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    })
  }

  /** Get summary stats for the Principal dashboard tab. */
  async getPrincipalSummary(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    const [total, pendingReview, highRisk, byType] = await Promise.all([
      this.prisma.learnerScreening.count({ where }),
      this.prisma.learnerScreening.count({ where: { ...where, reviewedByPrincipal: false } }),
      this.prisma.learnerScreening.count({ where: { ...where, riskLevel: 'HIGH' } }),
      this.prisma.learnerScreening.groupBy({
        by:    ['screenerType', 'riskLevel'],
        where,
        _count: { id: true },
      }),
    ])

    return { total, pendingReview, highRisk, byType }
  }

  /** List all screenings for a specific learner. */
  async getLearnerScreenings(schoolId: string, learnerId: string) {
    return this.prisma.learnerScreening.findMany({
      where: { schoolId, learnerId },
      orderBy: { administeredAt: 'desc' },
      include: {
        administeredBy: { select: { firstName: true, lastName: true } },
        reviewedBy:     { select: { firstName: true, lastName: true } },
        academicYear:   { select: { year: true } },
      },
    })
  }
}
