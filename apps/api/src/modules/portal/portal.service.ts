/**
 * Portal Service — Parent-facing read-only data access
 * ─────────────────────────────────────────────────────────────────────────────
 * Every method first verifies the requesting user owns a Guardian record that
 * is linked to the requested learner. This prevents parents from viewing data
 * that belongs to another family.
 *
 * Data path:
 *   User(role=PARENT) → Guardian(userId) ← LearnerGuardian → Learner
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Ownership check ───────────────────────────────────────────────────────

  /**
   * Throws ForbiddenException if this parent user is not linked to the
   * requested learner. Returns the LearnerGuardian link on success.
   */
  private async assertParentOwnsLearner(
    userId:    string,
    schoolId:  string,
    learnerId: string,
  ) {
    const link = await this.prisma.learnerGuardian.findFirst({
      where: {
        learnerId,
        guardian: { userId, schoolId },
      },
    })
    if (!link) {
      throw new ForbiddenException(
        'You do not have permission to view this learner\'s data'
      )
    }
    return link
  }

  // ── 1. My children ────────────────────────────────────────────────────────

  async getMyChildren(userId: string, schoolId: string) {
    const links = await this.prisma.learnerGuardian.findMany({
      where: {
        guardian: { userId, schoolId },
      },
      include: {
        learner: {
          include: {
            learnerEnrolments: {
              where:   { status: 'ACTIVE' },
              include: {
                class: { include: { grade: true } },
                academicYear: { select: { id: true, year: true } },
              },
              orderBy: { createdAt: 'desc' },
              take:    1,
            },
          },
        },
        guardian: {
          select: { isPrimaryContact: true, relationship: true },
        },
      },
      orderBy: { learner: { lastName: 'asc' } },
    })

    return links.map((link) => ({
      learnerId:    link.learner.id,
      firstName:    link.learner.firstName,
      lastName:     link.learner.lastName,
      studentNumber:link.learner.studentNumber,
      photoUrl:     link.learner.photoUrl,
      status:       link.learner.status,
      isPrimary:    link.isPrimary,
      relationship: (link.guardian as any).relationship,
      currentEnrolment: link.learner.learnerEnrolments[0] ?? null,
    }))
  }

  // ── 2. SBA marks (all subjects, all terms) ────────────────────────────────

  async getChildMarks(userId: string, schoolId: string, learnerId: string) {
    await this.assertParentOwnsLearner(userId, schoolId, learnerId)

    const results = await this.prisma.termSbaResult.findMany({
      where: { schoolId, learnerId },
      include: {
        subjectClass: {
          include: {
            schoolSubject: { select: { id: true, name: true } },
            class:         { include: { grade: true } },
          },
        },
        term: {
          select: { id: true, name: true, termNumber: true, startDate: true, endDate: true },
        },
      },
      orderBy: [
        { term: { termNumber: 'asc' } },
        { subjectClass: { schoolSubject: { name: 'asc' } } },
      ],
    })

    // Group by subject for easier frontend consumption
    const bySubject = new Map<
      string,
      {
        subjectName: string
        subjectId:   string
        terms:       Array<{
          termId:         string
          termName:       string
          termNumber:     number
          sbaPercentage:  number
          tasksCompleted: number
          tasksTotal:     number
          isAtRisk:       boolean
        }>
      }
    >()

    for (const r of results) {
      const sid  = r.subjectClass.schoolSubject.id
      const name = r.subjectClass.schoolSubject.name

      if (!bySubject.has(sid)) {
        bySubject.set(sid, { subjectId: sid, subjectName: name, terms: [] })
      }

      bySubject.get(sid)!.terms.push({
        termId:         r.termId,
        termName:       r.term.name,
        termNumber:     r.term.termNumber,
        sbaPercentage:  Number(r.sbaTotalPercentage),
        tasksCompleted: r.tasksCompleted,
        tasksTotal:     r.tasksTotal,
        isAtRisk:       r.isAtRisk,
      })
    }

    return Array.from(bySubject.values())
  }

  // ── 3. Attendance summary ─────────────────────────────────────────────────

  async getChildAttendance(userId: string, schoolId: string, learnerId: string) {
    await this.assertParentOwnsLearner(userId, schoolId, learnerId)

    // Overall summary grouped by status
    const summary = await this.prisma.attendanceRecord.groupBy({
      by:    ['status'],
      where: { schoolId, learnerId },
      _count: true,
    })

    // Recent absences (last 10)
    const recentAbsences = await this.prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        learnerId,
        status: { in: ['ABSENT', 'LATE', 'EXCUSED_ABSENT'] },
      },
      include: {
        attendanceRegister: {
          select: {
            date:  true,
            class: { select: { name: true, grade: { select: { gradeNumber: true } } } },
          },
        },
      },
      orderBy: { attendanceRegister: { date: 'desc' } },
      take:    10,
    })

    const total   = summary.reduce((sum, s) => sum + s._count, 0)
    const present = summary.find((s) => s.status === 'PRESENT')?._count ?? 0
    const absent  = summary.find((s) => s.status === 'ABSENT')?._count  ?? 0
    const late    = summary.find((s) => s.status === 'LATE')?._count    ?? 0
    const excused = summary.find((s) => s.status === 'EXCUSED_ABSENT')?._count ?? 0

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendancePct: total > 0 ? Math.round((present / total) * 100) : null,
      recentAbsences: recentAbsences.map((r) => ({
        date:      r.attendanceRegister.date,
        status:    r.status,
        notes:     r.notes,
        className: r.attendanceRegister.class?.name ?? '',
        grade:     r.attendanceRegister.class?.grade?.gradeNumber ?? null,
      })),
    }
  }

  // ── 4. Upcoming assessment tasks ──────────────────────────────────────────

  async getChildUpcomingAssessments(
    userId:    string,
    schoolId:  string,
    learnerId: string,
  ) {
    await this.assertParentOwnsLearner(userId, schoolId, learnerId)

    // Get the learner's active enrolment to find their class
    const enrolment = await this.prisma.learnerEnrolment.findFirst({
      where:   { schoolId, learnerId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
    if (!enrolment) return []

    // Get subject classes for this class
    const subjectClasses = await this.prisma.subjectClass.findMany({
      where: { classId: enrolment.classId, schoolId },
      select: { id: true },
    })
    const scIds = subjectClasses.map((sc) => sc.id)

    // Upcoming tasks with due dates from today forward
    return this.prisma.assessmentTask.findMany({
      where: {
        schoolId,
        subjectClassId: { in: scIds },
        dueDate:        { gte: new Date() },
        isExam:         false,
      },
      include: {
        programmeOfAssessment: {
          include: {
            subjectClass: {
              include: {
                schoolSubject: { select: { name: true } },
              },
            },
            term: { select: { name: true, termNumber: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take:    10,
    })
  }

  // ── 5. Published report cards ─────────────────────────────────────────────

  async getChildReports(userId: string, schoolId: string, learnerId: string) {
    await this.assertParentOwnsLearner(userId, schoolId, learnerId)

    return this.prisma.reportCard.findMany({
      where:   { schoolId, learnerId, status: 'PUBLISHED' },
      include: {
        term:         { select: { name: true, termNumber: true } },
        academicYear: { select: { year: true } },
        publishedBy:  { select: { firstName: true, lastName: true } },
      },
      orderBy: [
        { academicYear: { year: 'desc' } },
        { term:         { termNumber: 'desc' } },
      ],
    })
  }

  // ── 6. Child full summary (dashboard card) ────────────────────────────────

  async getChildSummary(userId: string, schoolId: string, learnerId: string) {
    await this.assertParentOwnsLearner(userId, schoolId, learnerId)

    const learner = await this.prisma.learner.findFirst({
      where: { id: learnerId, schoolId },
      include: {
        learnerEnrolments: {
          where:   { status: 'ACTIVE' },
          include: {
            class:       { include: { grade: true } },
            academicYear:{ select: { id: true, year: true } },
          },
          orderBy: { createdAt: 'desc' },
          take:    1,
        },
      },
    })
    if (!learner) throw new NotFoundException('Learner not found')

    // Attendance % for current term
    const enrolment = learner.learnerEnrolments[0]
    let attendancePct: number | null = null

    if (enrolment) {
      const currentTerm = await this.prisma.term.findFirst({
        where: {
          academicYearId: enrolment.academicYearId,
          isActive:       true,
        },
      })

      if (currentTerm) {
        const att = await this.prisma.attendanceRecord.groupBy({
          by:    ['status'],
          where: {
            schoolId,
            learnerId,
            attendanceRegister: { termId: currentTerm.id },
          },
          _count: true,
        })
        const total   = att.reduce((s, a) => s + a._count, 0)
        const present = att.find((a) => a.status === 'PRESENT')?._count ?? 0
        attendancePct = total > 0 ? Math.round((present / total) * 100) : null
      }
    }

    // At-risk subject count
    const atRiskCount = await this.prisma.termSbaResult.count({
      where: { schoolId, learnerId, isAtRisk: true },
    })

    // Upcoming assessment count
    const upcomingCount = enrolment
      ? await this.prisma.assessmentTask.count({
          where: {
            schoolId,
            subjectClass: { classId: enrolment.classId },
            dueDate:      { gte: new Date() },
            isExam:       false,
          },
        })
      : 0

    return {
      learner: {
        id:           learner.id,
        firstName:    learner.firstName,
        lastName:     learner.lastName,
        studentNumber:learner.studentNumber,
        photoUrl:     learner.photoUrl,
        status:       learner.status,
      },
      currentEnrolment: enrolment ?? null,
      attendancePct,
      atRiskCount,
      upcomingCount,
    }
  }
}
