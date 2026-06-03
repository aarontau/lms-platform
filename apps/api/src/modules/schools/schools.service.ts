import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateSchoolDto } from './dto/create-school.dto'
import { UpdateSchoolDto } from './dto/update-school.dto'

/**
 * Default South African school term dates by year and term.
 * These are indicative dates; schools may adjust via the update endpoint.
 */
function getSaTermDates(year: number): Array<{
  termNumber: number
  name: string
  startDate: Date
  endDate: Date
}> {
  return [
    {
      termNumber: 1,
      name: `Term 1 ${year}`,
      startDate: new Date(`${year}-01-15`),
      endDate: new Date(`${year}-03-28`),
    },
    {
      termNumber: 2,
      name: `Term 2 ${year}`,
      startDate: new Date(`${year}-04-08`),
      endDate: new Date(`${year}-06-20`),
    },
    {
      termNumber: 3,
      name: `Term 3 ${year}`,
      startDate: new Date(`${year}-07-08`),
      endDate: new Date(`${year}-09-19`),
    },
    {
      termNumber: 4,
      name: `Term 4 ${year}`,
      startDate: new Date(`${year}-10-01`),
      endDate: new Date(`${year}-12-05`),
    },
  ]
}

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public methods ───────────────────────────────────────────────────────────

  async create(dto: CreateSchoolDto) {
    await this.assertEmisAvailable(dto.emisNumber)
    await this.assertSubdomainAvailable(dto.subdomain)

    return this.prisma.school.create({
      data: {
        name: dto.name,
        emisNumber: dto.emisNumber,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        circuitId: dto.circuitId,
        schoolType: dto.schoolType as any,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        subdomain: dto.subdomain,
      },
    })
  }

  async findAll() {
    return this.prisma.school.findMany({
      include: {
        province: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true } },
        circuit: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        province: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true } },
        circuit: { select: { id: true, name: true } },
        academicYears: {
          orderBy: { year: 'desc' },
          take: 5,
          select: { id: true, year: true, isCurrent: true, startDate: true, endDate: true },
        },
      },
    })

    if (!school) throw new NotFoundException(`School with ID ${id} not found`)
    return school
  }

  async findBySubdomain(subdomain: string) {
    const school = await this.prisma.school.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        emisNumber: true,
        subdomain: true,
        status: true,
        logoUrl: true,
      },
    })

    if (!school) throw new NotFoundException(`No school found for subdomain '${subdomain}'`)
    return school
  }

  async update(id: string, dto: UpdateSchoolDto) {
    if (dto.subdomain) await this.assertSubdomainAvailable(dto.subdomain, id)
    if (dto.emisNumber) await this.assertEmisAvailable(dto.emisNumber, id)

    try {
      return await this.prisma.school.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.emisNumber !== undefined && { emisNumber: dto.emisNumber }),
          ...(dto.provinceId !== undefined && { provinceId: dto.provinceId }),
          ...(dto.districtId !== undefined && { districtId: dto.districtId }),
          ...(dto.circuitId !== undefined && { circuitId: dto.circuitId }),
          ...(dto.schoolType !== undefined && { schoolType: dto.schoolType as any }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.subdomain !== undefined && { subdomain: dto.subdomain }),
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`School with ID ${id} not found`)
      }
      throw error
    }
  }

  async setupAcademicYear(schoolId: string, year: number) {
    // Verify the school exists before doing anything else.
    await this.findOne(schoolId)

    const existing = await this.prisma.academicYear.findUnique({
      where: { schoolId_year: { schoolId, year } },
    })
    if (existing) {
      throw new ConflictException(`Academic year ${year} already exists for this school`)
    }

    const termDates = getSaTermDates(year)
    const yearStart = termDates[0].startDate
    const yearEnd = termDates[termDates.length - 1].endDate
    const currentDate = new Date()

    return this.prisma.$transaction(async (tx) => {
      // Unset the current flag on all existing academic years for this school.
      await tx.academicYear.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      })

      const academicYear = await tx.academicYear.create({
        data: {
          schoolId,
          year,
          isCurrent: true,
          startDate: yearStart,
          endDate: yearEnd,
        },
      })

      const terms = await Promise.all(
        termDates.map((term) =>
          tx.term.create({
            data: {
              schoolId,
              academicYearId: academicYear.id,
              termNumber: term.termNumber,
              name: term.name,
              startDate: term.startDate,
              endDate: term.endDate,
              isActive: currentDate >= term.startDate && currentDate <= term.endDate,
            },
          }),
        ),
      )

      return { academicYear, terms }
    })
  }

  // ── Dashboard stats ──────────────────────────────────────────────────────────

  async getDashboardStats(schoolId: string) {
    const [
      learnerCount,
      teacherCount,
      classCount,
      activeTerm,
      reportStats,
      promotionCounts,
      parentCount,
    ] = await Promise.all([
      this.prisma.learner.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { schoolId, role: 'TEACHER', isActive: true } }),
      this.prisma.class.count({ where: { schoolId } }),
      this.prisma.term.findFirst({
        where: { schoolId, isActive: true },
        select: { id: true, name: true, termNumber: true, startDate: true, endDate: true },
      }),
      // Report card counts
      this.prisma.reportCard.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: true,
      }),
      // Promotion decision summary
      this.prisma.promotionDecision.groupBy({
        by: ['finalDecision'],
        where: { schoolId },
        _count: true,
      }),
      // Parent portal accounts
      this.prisma.user.count({ where: { schoolId, role: 'PARENT', isActive: true } }),
    ])

    const publishedReports = reportStats.find((s) => s.status === 'PUBLISHED')?._count ?? 0
    const draftReports     = reportStats.find((s) => s.status === 'DRAFT')?._count     ?? 0

    const promoteCount  = promotionCounts.find((s) => s.finalDecision === 'PROMOTE')?._count  ?? 0
    const progressCount = promotionCounts.find((s) => s.finalDecision === 'PROGRESS')?._count ?? 0
    const repeatCount   = promotionCounts.find((s) => s.finalDecision === 'REPEAT')?._count   ?? 0

    return {
      learnerCount,
      teacherCount,
      classCount,
      activeTerm: activeTerm ?? null,
      reports: { published: publishedReports, draft: draftReports },
      promotion: { promote: promoteCount, progress: progressCount, repeat: repeatCount },
      parentCount,
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Throws ConflictException if the EMIS number is already taken by another school.
   * Pass excludeId to ignore the current record during updates.
   */
  private async assertEmisAvailable(emisNumber: string, excludeId?: string) {
    const existing = await this.prisma.school.findFirst({
      where: {
        emisNumber,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    })
    if (existing) {
      throw new ConflictException(`EMIS number ${emisNumber} is already in use`)
    }
  }

  /**
   * Throws ConflictException if the subdomain is already taken by another school.
   * Pass excludeId to ignore the current record during updates.
   */
  private async assertSubdomainAvailable(subdomain: string, excludeId?: string) {
    const existing = await this.prisma.school.findFirst({
      where: {
        subdomain,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    })
    if (existing) {
      throw new ConflictException(`Subdomain '${subdomain}' is already in use`)
    }
  }
}
