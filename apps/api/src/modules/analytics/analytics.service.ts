/**
 * Analytics Service — School performance metrics
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides aggregated metrics for the principal/HOD analytics dashboard:
 *   - Learner counts by grade and gender
 *   - Attendance rates (term and rolling 7-day)
 *   - Assessment performance (pass rates per subject per grade)
 *   - At-risk learner counts
 *   - Screener risk distribution
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Overview (principal dashboard) ──────────────────────────────────────

  async getOverview(schoolId: string, academicYearId?: string) {
    const [
      totalLearners,
      activeByGender,
      teacherCount,
      classCount,
      atRiskCount,
      screeningRisk,
      activeTerm,
    ] = await Promise.all([
      this.prisma.learner.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.learner.groupBy({
        by: ['gender'],
        where: { schoolId, status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.user.count({ where: { schoolId, role: 'TEACHER', isActive: true } }),
      this.prisma.class.count({ where: { schoolId } }),
      this.prisma.termSbaResult.count({
        where: { schoolId, isAtRisk: true },
      }),
      this.prisma.learnerScreening.groupBy({
        by: ['riskLevel'],
        where: { schoolId },
        _count: true,
      }),
      this.prisma.term.findFirst({
        where: { schoolId, isActive: true },
        select: {
          id: true, name: true, termNumber: true,
          startDate: true, endDate: true,
        },
      }),
    ])

    const maleCount   = activeByGender.find((r) => r.gender === 'MALE')?._count ?? 0
    const femaleCount = activeByGender.find((r) => r.gender === 'FEMALE')?._count ?? 0

    const highRisk     = screeningRisk.find((r) => r.riskLevel === 'HIGH')?._count ?? 0
    const moderateRisk = screeningRisk.find((r) => r.riskLevel === 'MODERATE')?._count ?? 0
    const lowRisk      = screeningRisk.find((r) => r.riskLevel === 'LOW')?._count ?? 0

    return {
      learners: {
        total:   totalLearners,
        male:    maleCount,
        female:  femaleCount,
      },
      staff: {
        teachers: teacherCount,
        classes:  classCount,
      },
      atRisk: {
        academic: atRiskCount,
        screener: { high: highRisk, moderate: moderateRisk, low: lowRisk },
      },
      activeTerm,
    }
  }

  // ── Enrolment by grade ───────────────────────────────────────────────────

  async getEnrolmentByGrade(schoolId: string, academicYearId?: string) {
    // If no academicYearId supplied, fall back to the current academic year for this school
    let resolvedAyId = academicYearId
    if (!resolvedAyId) {
      const currentAY = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
        select: { id: true },
      })
      resolvedAyId = currentAY?.id
    }
    if (!resolvedAyId) return []

    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: { schoolId, academicYearId: resolvedAyId, status: 'ACTIVE' },
      include: {
        grade: { select: { gradeNumber: true, name: true } },
        learner: { select: { gender: true } },
      },
    })

    const byGrade: Record<number, { name: string; male: number; female: number; total: number }> = {}
    for (const e of enrolments) {
      const gn = e.grade.gradeNumber
      if (!byGrade[gn]) byGrade[gn] = { name: e.grade.name, male: 0, female: 0, total: 0 }
      if (e.learner.gender === 'MALE') byGrade[gn].male++
      else if (e.learner.gender === 'FEMALE') byGrade[gn].female++
      byGrade[gn].total++
    }

    return Object.entries(byGrade)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([gradeNumber, data]) => ({ gradeNumber: parseInt(gradeNumber), ...data }))
  }

  // ── Attendance summary ───────────────────────────────────────────────────

  async getAttendanceSummary(schoolId: string, termId?: string) {
    // Total records in period
    const where: any = { schoolId }
    if (termId) where.attendanceRegister = { termId }

    const [total, present, absent, late] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'PRESENT' } }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'ABSENT' } }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'LATE' } }),
    ])

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    // 7-day rolling attendance
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRegisters = await this.prisma.attendanceRegister.findMany({
      where: { schoolId, date: { gte: sevenDaysAgo } },
      include: {
        attendanceRecords: {
          select: { status: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    const rollingDays = recentRegisters.map((r) => {
      const dayTotal  = r.attendanceRecords.length
      const dayPresent = r.attendanceRecords.filter((rec) => rec.status === 'PRESENT').length
      return {
        date:    r.date.toISOString().split('T')[0],
        rate:    dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
        present: dayPresent,
        absent:  dayTotal - dayPresent,
      }
    })

    return {
      overall: { total, present, absent, late, attendanceRate },
      rolling7Days: rollingDays,
    }
  }

  // ── Subject performance ──────────────────────────────────────────────────

  async getSubjectPerformance(schoolId: string, termId?: string) {
    // Get all SBA results for the term
    const sbaResults = await this.prisma.termSbaResult.findMany({
      where: {
        schoolId,
        ...(termId ? { termId } : {}),
      },
      include: {
        subjectClass: {
          include: {
            schoolSubject: { select: { name: true, code: true } },
            class: { include: { grade: { select: { gradeNumber: true } } } },
          },
        },
      },
    })

    // Group by subject
    const bySubject: Record<string, {
      name:         string
      code:         string
      grades:       number[]
      totalLearners:number
      atRisk:       number
      averageSba:   number
      sum:          number
    }> = {}

    for (const r of sbaResults) {
      const subjectKey = r.subjectClass.schoolSubject.code
      if (!bySubject[subjectKey]) {
        bySubject[subjectKey] = {
          name:          r.subjectClass.schoolSubject.name,
          code:          subjectKey,
          grades:        [],
          totalLearners: 0,
          atRisk:        0,
          averageSba:    0,
          sum:           0,
        }
      }
      const s = bySubject[subjectKey]
      s.totalLearners++
      s.sum += Number(r.sbaTotalPercentage)
      if (r.isAtRisk) s.atRisk++
      const gn = r.subjectClass.class.grade.gradeNumber
      if (!s.grades.includes(gn)) s.grades.push(gn)
    }

    return Object.values(bySubject)
      .map((s) => ({
        ...s,
        averageSba:   s.totalLearners > 0 ? Math.round(s.sum / s.totalLearners) : 0,
        passRate:     s.totalLearners > 0 ? Math.round(((s.totalLearners - s.atRisk) / s.totalLearners) * 100) : 0,
        grades:       s.grades.sort((a, b) => a - b),
        sum:          undefined,
      }))
      .sort((a, b) => a.averageSba - b.averageSba) // Lowest performers first
  }

  // ── At-risk learners ─────────────────────────────────────────────────────

  async getAtRiskLearners(schoolId: string, termId?: string, limit = 20) {
    const results = await this.prisma.termSbaResult.findMany({
      where: {
        schoolId,
        isAtRisk: true,
        ...(termId ? { termId } : {}),
      },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, studentNumber: true,
          },
        },
        subjectClass: {
          include: {
            schoolSubject: { select: { name: true } },
            class: { select: { name: true, grade: { select: { gradeNumber: true } } } },
          },
        },
      },
      orderBy: { sbaTotalPercentage: 'asc' },
      take: limit * 3, // Fetch more, group by learner
    })

    // Group by learner
    const byLearner: Record<string, {
      learnerId:    string
      name:         string
      studentNumber:string
      grade:        number
      className:    string
      atRiskCount:  number
      subjects:     string[]
    }> = {}

    for (const r of results) {
      const lid = r.learnerId
      if (!byLearner[lid]) {
        byLearner[lid] = {
          learnerId:     lid,
          name:          `${r.learner.firstName} ${r.learner.lastName}`,
          studentNumber: r.learner.studentNumber,
          grade:         r.subjectClass.class.grade.gradeNumber,
          className:     r.subjectClass.class.name,
          atRiskCount:   0,
          subjects:      [],
        }
      }
      byLearner[lid].atRiskCount++
      byLearner[lid].subjects.push(r.subjectClass.schoolSubject.name)
    }

    return Object.values(byLearner)
      .sort((a, b) => b.atRiskCount - a.atRiskCount)
      .slice(0, limit)
  }
}
