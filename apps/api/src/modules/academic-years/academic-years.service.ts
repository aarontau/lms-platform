import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateAcademicYearDto } from './dto/create-academic-year.dto'
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto'

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateAcademicYearDto) {
    try {
      const existing = await this.prisma.academicYear.findUnique({
        where: { schoolId_year: { schoolId, year: dto.year } },
      })
      if (existing) {
        throw new ConflictException(`Academic year ${dto.year} already exists for this school`)
      }

      const result = await this.prisma.$transaction(async (tx) => {
        if (dto.isCurrent) {
          await tx.academicYear.updateMany({
            where: { schoolId },
            data: { isCurrent: false },
          })
        }

        return tx.academicYear.create({
          data: {
            schoolId,
            year: dto.year,
            isCurrent: dto.isCurrent ?? false,
            startDate: dto.startDate,
            endDate: dto.endDate,
          },
          include: {
            terms: { orderBy: { termNumber: 'asc' } },
          },
        })
      })

      return result
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to create academic year')
    }
  }

  async findAll(schoolId: string) {
    try {
      const years = await this.prisma.academicYear.findMany({
        where: { schoolId },
        include: {
          terms: {
            orderBy: { termNumber: 'asc' },
            select: { id: true, termNumber: true, name: true, startDate: true, endDate: true, isActive: true },
          },
        },
        orderBy: { year: 'desc' },
      })

      return years
    } catch (error) {
      throw new BadRequestException('Failed to retrieve academic years')
    }
  }

  async findOne(id: string, schoolId: string) {
    try {
      const year = await this.prisma.academicYear.findFirst({
        where: { id, schoolId },
        include: {
          terms: {
            orderBy: { termNumber: 'asc' },
          },
          grades: {
            orderBy: { gradeNumber: 'asc' },
            select: { id: true, gradeNumber: true, name: true },
          },
        },
      })

      if (!year) {
        throw new NotFoundException(`Academic year with ID ${id} not found`)
      }

      return year
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to retrieve academic year with ID ${id}`)
    }
  }

  async update(id: string, schoolId: string, dto: UpdateAcademicYearDto) {
    try {
      await this.findOne(id, schoolId)

      const result = await this.prisma.$transaction(async (tx) => {
        if (dto.isCurrent) {
          await tx.academicYear.updateMany({
            where: { schoolId, id: { not: id } },
            data: { isCurrent: false },
          })
        }

        return tx.academicYear.update({
          where: { id },
          data: {
            year: dto.year,
            isCurrent: dto.isCurrent,
            startDate: dto.startDate,
            endDate: dto.endDate,
          },
        })
      })

      return result
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to update academic year')
    }
  }

  async setCurrent(id: string, schoolId: string) {
    try {
      await this.findOne(id, schoolId)

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.academicYear.updateMany({
          where: { schoolId },
          data: { isCurrent: false },
        })

        return tx.academicYear.update({
          where: { id },
          data: { isCurrent: true },
        })
      })

      return result
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('Failed to set current academic year')
    }
  }
}
