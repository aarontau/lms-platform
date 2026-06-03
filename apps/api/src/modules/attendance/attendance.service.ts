import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService }           from '../../prisma/prisma.service'
import { NotificationsService }    from '../notifications/notifications.service'
import { CreateAttendanceRegisterDto } from './dto/create-attendance-register.dto'
import { MarkAttendanceDto }       from './dto/mark-attendance.dto'

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma:         PrismaService,
    private readonly notifications:  NotificationsService,
  ) {}

  // ─── Get or Create Register ──────────────────────────────────────────────────

  async getOrCreateRegister(schoolId: string, teacherId: string, dto: CreateAttendanceRegisterDto) {
    const dateObj = new Date(dto.date)
    dateObj.setUTCHours(0, 0, 0, 0)

    // Verify class belongs to school
    const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } })
    if (!cls) throw new NotFoundException(`Class ${dto.classId} not found`)

    // Check if register already exists
    const existing = await this.prisma.attendanceRegister.findUnique({
      where: { schoolId_classId_date: { schoolId, classId: dto.classId, date: dateObj } },
      include: {
        class: { select: { id: true, name: true } },
        attendanceRecords: {
          include: {
            learner: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          },
        },
      },
    })

    if (existing) return { register: existing, created: false }

    // Verify term and academic year
    const [term, year] = await Promise.all([
      this.prisma.term.findFirst({ where: { id: dto.termId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
    ])
    if (!term) throw new NotFoundException(`Term ${dto.termId} not found`)
    if (!year) throw new NotFoundException(`Academic year ${dto.academicYearId} not found`)

    // Get all active learners enrolled in this class
    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: { classId: dto.classId, academicYearId: dto.academicYearId, status: 'ACTIVE' },
      select: { learnerId: true },
    })

    // Create register + default all learners to PRESENT
    const register = await this.prisma.attendanceRegister.create({
      data: {
        schoolId,
        classId: dto.classId,
        date: dateObj,
        teacherId,
        academicYearId: dto.academicYearId,
        termId: dto.termId,
        attendanceRecords: {
          create: enrolments.map((e) => ({
            schoolId,
            learnerId: e.learnerId,
            status: 'PRESENT' as const,
          })),
        },
      },
      include: {
        class: { select: { id: true, name: true } },
        attendanceRecords: {
          include: {
            learner: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          },
        },
      },
    })

    return { register, created: true }
  }

  // ─── Mark Attendance ─────────────────────────────────────────────────────────

  async markAttendance(registerId: string, schoolId: string, dto: MarkAttendanceDto) {
    const register = await this.prisma.attendanceRegister.findFirst({
      where: { id: registerId, schoolId },
      include: {
        class:  { select: { id: true, name: true } },
        school: { select: { name: true } },
      },
    })
    if (!register) throw new NotFoundException(`Attendance register ${registerId} not found`)

    // Upsert each record
    const updates = await Promise.all(
      dto.records.map((record) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            attendanceRegisterId_learnerId: {
              attendanceRegisterId: registerId,
              learnerId: record.learnerId,
            },
          },
          create: {
            schoolId,
            attendanceRegisterId: registerId,
            learnerId: record.learnerId,
            status: record.status as any,
            notes: record.notes,
          },
          update: {
            status: record.status as any,
            notes: record.notes,
          },
        })
      )
    )

    // Fire absence alerts asynchronously (do not block the response)
    const absentIds = dto.records
      .filter((r) => r.status === 'ABSENT')
      .map((r) => r.learnerId)

    if (absentIds.length > 0) {
      const dateStr = (register as any).date
        ? new Date((register as any).date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-ZA')
      const className  = (register as any).class?.name ?? 'Unknown Class'
      const schoolName = (register as any).school?.name ?? 'School'

      this.notifications.sendAbsenceAlerts({
        schoolId,
        schoolName,
        className,
        date: dateStr,
        absentLearnerIds: absentIds,
      }).catch((err) => console.error('Absence alert error:', err))
    }

    return { updated: updates.length, registerId }
  }

  // ─── Get Register with Records ───────────────────────────────────────────────

  async getRegister(registerId: string, schoolId: string) {
    const register = await this.prisma.attendanceRegister.findFirst({
      where: { id: registerId, schoolId },
      include: {
        class: { select: { id: true, name: true, grade: { select: { gradeNumber: true, name: true } } } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        term: { select: { id: true, termNumber: true, name: true } },
        attendanceRecords: {
          include: {
            learner: { select: { id: true, firstName: true, lastName: true, studentNumber: true, gender: true } },
          },
          orderBy: { learner: { lastName: 'asc' } },
        },
      },
    })
    if (!register) throw new NotFoundException(`Register ${registerId} not found`)
    return register
  }

  async getRegisterByClassDate(schoolId: string, classId: string, date: string) {
    const dateObj = new Date(date)
    dateObj.setUTCHours(0, 0, 0, 0)

    return this.prisma.attendanceRegister.findUnique({
      where: { schoolId_classId_date: { schoolId, classId, date: dateObj } },
      include: {
        class: { select: { id: true, name: true } },
        attendanceRecords: {
          include: {
            learner: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          },
          orderBy: { learner: { lastName: 'asc' } },
        },
      },
    })
  }

  // ─── Summary Reports ─────────────────────────────────────────────────────────

  async getLearnerSummary(schoolId: string, learnerId: string, termId?: string) {
    const where: any = { schoolId, learnerId }
    if (termId) {
      where.attendanceRegister = { termId }
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      select: { status: true },
    })

    const total   = records.length
    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
    const absent  = records.filter((r) => r.status === 'ABSENT').length
    const late    = records.filter((r) => r.status === 'LATE').length
    const excused = records.filter((r) => r.status === 'EXCUSED_ABSENT').length

    return {
      learnerId,
      total,
      present,
      absent,
      late,
      excused,
      attendancePercent: total > 0 ? Math.round((present / total) * 100) : 100,
      isAtRisk: total > 10 && present / total < 0.8,
    }
  }

  async getClassSummary(schoolId: string, classId: string, termId?: string) {
    const registerWhere: any = { schoolId, classId }
    if (termId) registerWhere.termId = termId

    const registers = await this.prisma.attendanceRegister.findMany({
      where: registerWhere,
      select: { id: true, date: true },
      orderBy: { date: 'asc' },
    })

    const totalDays = registers.length
    if (totalDays === 0) return { classId, totalDays: 0, learnerSummaries: [] }

    const registerIds = registers.map((r) => r.id)

    // Aggregate by learner
    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['learnerId', 'status'],
      where: { attendanceRegisterId: { in: registerIds } },
      _count: { status: true },
    })

    // Build per-learner map
    const learnerMap = new Map<string, { present: number; absent: number; late: number; excused: number }>()
    for (const rec of records) {
      if (!learnerMap.has(rec.learnerId)) {
        learnerMap.set(rec.learnerId, { present: 0, absent: 0, late: 0, excused: 0 })
      }
      const entry = learnerMap.get(rec.learnerId)!
      if (rec.status === 'PRESENT') entry.present += rec._count.status
      else if (rec.status === 'ABSENT') entry.absent += rec._count.status
      else if (rec.status === 'LATE') entry.late += rec._count.status
      else if (rec.status === 'EXCUSED_ABSENT') entry.excused += rec._count.status
    }

    // Fetch learner details for display
    const learnerIds = Array.from(learnerMap.keys())
    const learners   = await this.prisma.learner.findMany({
      where:  { id: { in: learnerIds } },
      select: { id: true, firstName: true, lastName: true, studentNumber: true },
    })
    const learnerById = Object.fromEntries(learners.map((l) => [l.id, l]))

    const learnerSummaries = Array.from(learnerMap.entries()).map(([learnerId, counts]) => {
      const attended = counts.present + counts.late
      return {
        learnerId,
        learner: learnerById[learnerId] ?? null,
        ...counts,
        attendancePercent: Math.round((attended / totalDays) * 100),
        isAtRisk: attended / totalDays < 0.8,
      }
    })

    return { classId, totalDays, learnerSummaries }
  }

  // ─── Pending Registers (classes that haven't captured today) ─────────────────

  async getPendingRegisters(schoolId: string, date: string, academicYearId: string) {
    const dateObj = new Date(date)
    dateObj.setUTCHours(0, 0, 0, 0)

    // All classes for this school and year
    const [allClasses, capturedRegisters] = await Promise.all([
      this.prisma.class.findMany({
        where: { schoolId, academicYearId },
        select: { id: true, name: true, classTeacherId: true,
          grade: { select: { gradeNumber: true, name: true } } },
      }),
      this.prisma.attendanceRegister.findMany({
        where: { schoolId, date: dateObj, academicYearId },
        select: { classId: true },
      }),
    ])

    const capturedClassIds = new Set(capturedRegisters.map((r) => r.classId))

    return allClasses
      .filter((c) => !capturedClassIds.has(c.id))
      .map((c) => ({ ...c, hasCaptured: false }))
  }

  // ─── List Registers for a school/class ───────────────────────────────────────

  async listRegisters(schoolId: string, filters: {
    classId?: string
    startDate?: string
    endDate?: string
    termId?: string
    page?: number
    limit?: number
  }) {
    const where: any = { schoolId }
    if (filters.classId) where.classId = filters.classId
    if (filters.termId)  where.termId  = filters.termId
    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = new Date(filters.startDate)
      if (filters.endDate)   where.date.lte = new Date(filters.endDate)
    }

    const page  = filters.page  ?? 1
    const limit = filters.limit ?? 20

    const [data, total] = await Promise.all([
      this.prisma.attendanceRegister.findMany({
        where,
        include: {
          class: { select: { id: true, name: true, grade: { select: { gradeNumber: true, name: true } } } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { attendanceRecords: true } },
        },
        orderBy: { date: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      this.prisma.attendanceRegister.count({ where }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }
}
