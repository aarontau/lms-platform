import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePeriodDto } from './dto/create-period.dto'
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto'

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Periods ─────────────────────────────────────────────────────────────────

  async findAllPeriods(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    return this.prisma.period.findMany({
      where,
      include: {
        academicYear: { select: { id: true, year: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    })
  }

  async createPeriod(schoolId: string, dto: CreatePeriodDto) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    })
    if (!year) throw new NotFoundException(`Academic year ${dto.academicYearId} not found`)

    return this.prisma.period.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        periodNumber: dto.periodNumber,
        startTime: dto.startTime,
        endTime: dto.endTime,
        dayOfWeek: dto.dayOfWeek,
        isLesson: dto.isLesson ?? true,
      },
    })
  }

  async updatePeriod(id: string, schoolId: string, dto: Partial<CreatePeriodDto>) {
    const period = await this.prisma.period.findFirst({ where: { id, schoolId } })
    if (!period) throw new NotFoundException(`Period ${id} not found`)

    const data: any = {}
    if (dto.name         !== undefined) data.name         = dto.name
    if (dto.periodNumber !== undefined) data.periodNumber = dto.periodNumber
    if (dto.startTime    !== undefined) data.startTime    = dto.startTime
    if (dto.endTime      !== undefined) data.endTime      = dto.endTime
    if (dto.dayOfWeek    !== undefined) data.dayOfWeek    = dto.dayOfWeek
    if (dto.isLesson     !== undefined) data.isLesson     = dto.isLesson

    return this.prisma.period.update({ where: { id }, data })
  }

  async deletePeriod(id: string, schoolId: string) {
    const period = await this.prisma.period.findFirst({ where: { id, schoolId } })
    if (!period) throw new NotFoundException(`Period ${id} not found`)

    const slotCount = await this.prisma.timetableSlot.count({ where: { periodId: id } })
    if (slotCount > 0) {
      throw new BadRequestException(
        `Cannot delete period: ${slotCount} timetable slot(s) are assigned to it. Remove them first.`
      )
    }

    return this.prisma.period.delete({ where: { id } })
  }

  // ─── Timetable Slots ─────────────────────────────────────────────────────────

  async findAllSlots(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    return this.prisma.timetableSlot.findMany({
      where,
      include: {
        period: { select: { id: true, name: true, periodNumber: true, startTime: true, endTime: true, dayOfWeek: true } },
        subjectClass: {
          select: {
            id: true,
            schoolSubject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, grade: { select: { gradeNumber: true, name: true } } } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        venue: { select: { id: true, name: true, venueType: true } },
      },
      orderBy: [{ period: { dayOfWeek: 'asc' } }, { period: { periodNumber: 'asc' } }],
    })
  }

  async findSlotsByClass(schoolId: string, classId: string, academicYearId: string) {
    return this.prisma.timetableSlot.findMany({
      where: {
        schoolId,
        academicYearId,
        subjectClass: { classId },
      },
      include: {
        period: { select: { id: true, name: true, periodNumber: true, startTime: true, endTime: true, dayOfWeek: true } },
        subjectClass: {
          select: {
            id: true,
            schoolSubject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        venue: { select: { id: true, name: true } },
      },
      orderBy: [{ period: { dayOfWeek: 'asc' } }, { period: { periodNumber: 'asc' } }],
    })
  }

  async findSlotsByTeacher(schoolId: string, teacherId: string, academicYearId: string) {
    return this.prisma.timetableSlot.findMany({
      where: {
        schoolId,
        academicYearId,
        subjectClass: { teacherId },
      },
      include: {
        period: { select: { id: true, name: true, periodNumber: true, startTime: true, endTime: true, dayOfWeek: true } },
        subjectClass: {
          select: {
            id: true,
            schoolSubject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, grade: { select: { gradeNumber: true, name: true } } } },
          },
        },
        venue: { select: { id: true, name: true } },
      },
      orderBy: [{ period: { dayOfWeek: 'asc' } }, { period: { periodNumber: 'asc' } }],
    })
  }

  async createSlot(schoolId: string, dto: CreateTimetableSlotDto) {
    // Verify all FK references
    const [period, subjectClass, venue, year] = await Promise.all([
      this.prisma.period.findFirst({ where: { id: dto.periodId, schoolId } }),
      this.prisma.subjectClass.findFirst({ where: { id: dto.subjectClassId, schoolId } }),
      this.prisma.venue.findFirst({ where: { id: dto.venueId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
    ])

    if (!period)       throw new NotFoundException(`Period ${dto.periodId} not found`)
    if (!subjectClass) throw new NotFoundException(`Subject class ${dto.subjectClassId} not found`)
    if (!venue)        throw new NotFoundException(`Venue ${dto.venueId} not found`)
    if (!year)         throw new NotFoundException(`Academic year ${dto.academicYearId} not found`)

    // Conflict detection — same period, same academic year
    const [teacherConflict, venueConflict, existingSlot] = await Promise.all([
      // Teacher already teaching in this period
      this.prisma.timetableSlot.findFirst({
        where: {
          schoolId,
          periodId: dto.periodId,
          academicYearId: dto.academicYearId,
          subjectClass: { teacherId: subjectClass.teacherId },
          NOT: { subjectClassId: dto.subjectClassId },
        },
        include: { subjectClass: { include: { schoolSubject: true, class: true } } },
      }),
      // Venue already in use in this period
      this.prisma.timetableSlot.findFirst({
        where: {
          schoolId,
          periodId: dto.periodId,
          venueId: dto.venueId,
          academicYearId: dto.academicYearId,
        },
        include: { subjectClass: { include: { schoolSubject: true, class: true } } },
      }),
      // Same slot already exists
      this.prisma.timetableSlot.findUnique({
        where: {
          schoolId_periodId_subjectClassId_academicYearId: {
            schoolId,
            periodId: dto.periodId,
            subjectClassId: dto.subjectClassId,
            academicYearId: dto.academicYearId,
          },
        },
      }),
    ])

    if (existingSlot) throw new ConflictException('This subject class is already assigned to this period')

    if (teacherConflict) {
      const sc = teacherConflict.subjectClass
      throw new ConflictException(
        `Teacher conflict: the assigned teacher already has ${sc.schoolSubject.name} (${sc.class.name}) in this period`
      )
    }

    if (venueConflict) {
      const sc = venueConflict.subjectClass
      throw new ConflictException(
        `Venue conflict: ${venue.name} is already used for ${sc.schoolSubject.name} (${sc.class.name}) in this period`
      )
    }

    return this.prisma.timetableSlot.create({
      data: {
        schoolId,
        periodId: dto.periodId,
        subjectClassId: dto.subjectClassId,
        venueId: dto.venueId,
        academicYearId: dto.academicYearId,
      },
      include: {
        period: { select: { id: true, name: true, periodNumber: true, startTime: true, endTime: true, dayOfWeek: true } },
        subjectClass: {
          select: {
            id: true,
            schoolSubject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        venue: { select: { id: true, name: true } },
      },
    })
  }

  async deleteSlot(id: string, schoolId: string) {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { id, schoolId } })
    if (!slot) throw new NotFoundException(`Timetable slot ${id} not found`)
    return this.prisma.timetableSlot.delete({ where: { id } })
  }

  // ─── Venues ──────────────────────────────────────────────────────────────────

  async findAllVenues(schoolId: string) {
    return this.prisma.venue.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  async createVenue(schoolId: string, dto: { name: string; capacity: number; venueType: string }) {
    return this.prisma.venue.create({
      data: { schoolId, name: dto.name, capacity: dto.capacity, venueType: dto.venueType as any },
    })
  }
}
