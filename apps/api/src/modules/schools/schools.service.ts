import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
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

  async create(dto: CreateSchoolDto) {
    try {
      const existingEmis = await this.prisma.school.findUnique({
        where: { emisNumber: dto.emisNumber },
      })
      if (existingEmis) {
        throw new ConflictException(`A school with EMIS number ${dto.emisNumber} already exists`)
      }

      const existingSubdomain = await this.prisma.school.findUnique({
        where: { subdomain: dto.subdomain },
      })
      if (existingSubdomain) {
        throw new ConflictException(`Subdomain '${dto.subdomain}' is already in use`)
      }

      const school = await this.prisma.school.create({
        data: {
          name: dto.name,
          emisNumber: dto.emisNumber,
          provinceId: dto.provinceId,
          districtId: dto.districtId || dto.provinceId,
          circuitId: dto.circuitId || dto.provinceId,
          schoolType: dto.schoolType as any,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          subdomain: dto.subdomain,
        },
      })

      return school
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to create school. Please verify all provided IDs are valid.')
    }
  }

  async findAll() {
    try {
      const schools = await this.prisma.school.findMany({
        include: {
          province: { select: { id: true, name: true, code: true } },
          district: { select: { id: true, name: true } },
          circuit: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      })

      return schools
    } catch (error) {
      throw new BadRequestException('Failed to retrieve schools')
    }
  }

  async findOne(id: string) {
    try {
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

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`)
      }

      return school
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to retrieve school with ID ${id}`)
    }
  }

  async update(id: string, dto: UpdateSchoolDto) {
    try {
      await this.findOne(id)

      if (dto.subdomain) {
        const existing = await this.prisma.school.findFirst({
          where: { subdomain: dto.subdomain, id: { not: id } },
        })
        if (existing) {
          throw new ConflictException(`Subdomain '${dto.subdomain}' is already in use`)
        }
      }

      if (dto.emisNumber) {
        const existing = await this.prisma.school.findFirst({
          where: { emisNumber: dto.emisNumber, id: { not: id } },
        })
        if (existing) {
          throw new ConflictException(`EMIS number ${dto.emisNumber} is already in use`)
        }
      }

      const updateData: any = {}
      if (dto.name !== undefined) updateData.name = dto.name
      if (dto.emisNumber !== undefined) updateData.emisNumber = dto.emisNumber
      if (dto.provinceId !== undefined) updateData.provinceId = dto.provinceId
      if (dto.districtId !== undefined) updateData.districtId = dto.districtId
      if (dto.circuitId !== undefined) updateData.circuitId = dto.circuitId
      if (dto.schoolType !== undefined) updateData.schoolType = dto.schoolType
      if (dto.phone !== undefined) updateData.phone = dto.phone
      if (dto.email !== undefined) updateData.email = dto.email
      if (dto.address !== undefined) updateData.address = dto.address
      if (dto.subdomain !== undefined) updateData.subdomain = dto.subdomain

      const school = await this.prisma.school.update({
        where: { id },
        data: updateData,
      })

      return school
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to update school')
    }
  }

  async findBySubdomain(subdomain: string) {
    try {
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

      if (!school) {
        throw new NotFoundException(`No school found for subdomain '${subdomain}'`)
      }

      return school
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to look up school by subdomain '${subdomain}'`)
    }
  }

  async setupAcademicYear(schoolId: string, year: number) {
    try {
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

      const result = await this.prisma.$transaction(async (tx) => {
        // Set all existing academic years to not current
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

        const currentDate = new Date()

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
                isActive:
                  currentDate >= term.startDate && currentDate <= term.endDate,
              },
            }),
          ),
        )

        return { academicYear, terms }
      })

      return result
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException(`Failed to set up academic year ${year}`)
    }
  }
}
