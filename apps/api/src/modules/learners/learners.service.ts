import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateLearnerDto } from './dto/create-learner.dto'
import { UpdateLearnerDto } from './dto/update-learner.dto'
import { CreateGuardianDto } from './dto/create-guardian.dto'
import { LinkGuardianDto } from './dto/link-guardian.dto'
import { LearnerFiltersDto } from './dto/learner-filters.dto'

@Injectable()
export class LearnersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Student Number Generation ───────────────────────────────────────────────
  private async generateStudentNumber(schoolId: string, year: number): Promise<string> {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
    const endOfYear   = new Date(`${year}-12-31T23:59:59.999Z`)
    const count = await this.prisma.learner.count({
      where: { schoolId, createdAt: { gte: startOfYear, lte: endOfYear } },
    })
    const seq = String(count + 1).padStart(4, '0')
    return `SCH-${year}-${seq}`
  }

  // ── Create Learner ──────────────────────────────────────────────────────────
  async create(schoolId: string, dto: CreateLearnerDto) {
    const grade = await this.prisma.grade.findFirst({ where: { id: dto.gradeId, schoolId } })
    if (!grade) throw new NotFoundException('Grade not found or does not belong to this school')

    const cls = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } })
    if (!cls) throw new NotFoundException('Class not found or does not belong to this school')

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    })
    if (!academicYear) {
      throw new BadRequestException('No current academic year configured. Please set up an academic year first.')
    }

    const year = new Date().getFullYear()
    const studentNumber = await this.generateStudentNumber(schoolId, year)

    return this.prisma.$transaction(async (tx) => {
      const learner = await tx.learner.create({
        data: {
          schoolId,
          studentNumber,
          firstName:      dto.firstName,
          middleName:     dto.middleName,
          lastName:       dto.lastName,
          dateOfBirth:    new Date(dto.dateOfBirth),
          gender:         dto.gender,
          nationality:    dto.nationality ?? 'South African',
          homeLanguage:   dto.homeLanguage,
          idNumber:       dto.idNumber,
          idType:         dto.idType,
          admissionDate:  new Date(dto.admissionDate),
          admissionNumber: dto.admissionNumber,
          previousSchool: dto.previousSchool,
          hasSpecialNeeds: dto.hasSpecialNeeds ?? false,
          medicalNotes:   dto.medicalNotes,
          status:         'ACTIVE',
        },
      })

      await tx.learnerEnrolment.create({
        data: {
          schoolId,
          learnerId:      learner.id,
          academicYearId: academicYear.id,
          gradeId:        dto.gradeId,
          classId:        dto.classId,
          enrolmentDate:  new Date(dto.admissionDate),
          status:         'ACTIVE',
        },
      })

      return learner
    })
  }

  // ── List Learners (paginated + filtered) ────────────────────────────────────
  async findAll(schoolId: string, filters: LearnerFiltersDto) {
    const { search, gradeId, classId, status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    const where: any = { schoolId, deletedAt: null }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName:     { contains: search, mode: 'insensitive' } },
        { lastName:      { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (gradeId || classId) {
      where.learnerEnrolments = {
        some: {
          status: 'ACTIVE',
          ...(gradeId && { gradeId }),
          ...(classId && { classId }),
        },
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.learner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          learnerEnrolments: {
            where: { status: 'ACTIVE' },
            include: { grade: true, class: true },
            take: 1,
            orderBy: { enrolmentDate: 'desc' },
          },
        },
      }),
      this.prisma.learner.count({ where }),
    ])

    // Map learnerEnrolments[0] → currentEnrolment for the frontend
    const data = rows.map(({ learnerEnrolments, ...l }) => ({
      ...l,
      currentEnrolment: learnerEnrolments?.[0] ?? null,
    }))

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ── Get Single Learner (full profile) ───────────────────────────────────────
  async findOne(schoolId: string, id: string) {
    const raw = await this.prisma.learner.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        learnerEnrolments: {
          include: { grade: true, class: true, academicYear: true },
          orderBy: { enrolmentDate: 'desc' },
        },
        learnerGuardians: {
          include: { guardian: true },
          orderBy: { isPrimary: 'desc' },
        },
        learningProfiles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        diagnosticAssessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 5,
        },
      },
    })
    if (!raw) throw new NotFoundException('Learner not found')

    // Rename relations to match frontend expectations
    const { learnerEnrolments, learnerGuardians, ...rest } = raw
    return {
      ...rest,
      enrolments:      learnerEnrolments,
      guardianLinks:   learnerGuardians,
      currentEnrolment: learnerEnrolments?.[0] ?? null,
    }
  }

  // ── Update Learner ──────────────────────────────────────────────────────────
  async update(schoolId: string, id: string, dto: UpdateLearnerDto) {
    const learner = await this.prisma.learner.findFirst({ where: { id, schoolId, deletedAt: null } })
    if (!learner) throw new NotFoundException('Learner not found')

    const { gradeId, classId, ...rest } = dto as any
    const updateData: any = { ...rest }
    if (dto.dateOfBirth)   updateData.dateOfBirth   = new Date(dto.dateOfBirth)
    if (dto.admissionDate) updateData.admissionDate = new Date(dto.admissionDate)

    return this.prisma.learner.update({ where: { id }, data: updateData })
  }

  // ── Deactivate Learner ──────────────────────────────────────────────────────
  async deactivate(schoolId: string, id: string) {
    const learner = await this.prisma.learner.findFirst({ where: { id, schoolId, deletedAt: null } })
    if (!learner) throw new NotFoundException('Learner not found')
    return this.prisma.learner.update({ where: { id }, data: { status: 'INACTIVE' } })
  }

  // ── Guardian Management ─────────────────────────────────────────────────────
  async createGuardian(schoolId: string, learnerId: string, dto: CreateGuardianDto) {
    const learner = await this.prisma.learner.findFirst({ where: { id: learnerId, schoolId, deletedAt: null } })
    if (!learner) throw new NotFoundException('Learner not found')

    return this.prisma.$transaction(async (tx) => {
      const guardian = await tx.guardian.create({
        data: {
          schoolId,
          firstName:        dto.firstName,
          lastName:         dto.lastName,
          idNumber:         dto.idNumber,
          phonePrimary:     dto.phonePrimary,
          phoneSecondary:   dto.phoneSecondary,
          email:            dto.email,
          relationship:     dto.relationship,
          isPrimaryContact: dto.isPrimaryContact ?? false,
          canCollect:       dto.canCollect ?? true,
        },
      })

      await tx.learnerGuardian.create({
        data: {
          schoolId,
          learnerId,
          guardianId: guardian.id,
          isPrimary:  dto.isPrimaryContact ?? false,
        },
      })

      return guardian
    })
  }

  async linkGuardian(schoolId: string, learnerId: string, dto: LinkGuardianDto) {
    const learner = await this.prisma.learner.findFirst({ where: { id: learnerId, schoolId, deletedAt: null } })
    if (!learner) throw new NotFoundException('Learner not found')

    const guardian = await this.prisma.guardian.findFirst({ where: { id: dto.guardianId, schoolId } })
    if (!guardian) throw new NotFoundException('Guardian not found')

    const existing = await this.prisma.learnerGuardian.findFirst({
      where: { learnerId, guardianId: dto.guardianId },
    })
    if (existing) throw new ConflictException('Guardian is already linked to this learner')

    return this.prisma.learnerGuardian.create({
      data: {
        schoolId,
        learnerId,
        guardianId: dto.guardianId,
        isPrimary:  dto.isPrimary ?? false,
      },
    })
  }

  async getGuardians(schoolId: string, learnerId: string) {
    const learner = await this.prisma.learner.findFirst({ where: { id: learnerId, schoolId, deletedAt: null } })
    if (!learner) throw new NotFoundException('Learner not found')

    return this.prisma.learnerGuardian.findMany({
      where: { learnerId, schoolId },
      include: { guardian: true },
      orderBy: { isPrimary: 'desc' },
    })
  }

  // ── Bulk Import ─────────────────────────────────────────────────────────────
  async bulkImport(schoolId: string, rows: CreateLearnerDto[]) {
    const results = {
      success: 0,
      failed:  0,
      errors:  [] as { row: number; error: string }[],
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.create(schoolId, rows[i])
        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push({ row: i + 1, error: err?.message ?? 'Unknown error' })
      }
    }

    return results
  }
}
