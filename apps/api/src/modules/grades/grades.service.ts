import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateGradeDto } from './dto/create-grade.dto'
import { UpdateGradeDto } from './dto/update-grade.dto'

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateGradeDto) {
    try {
      const existing = await this.prisma.grade.findUnique({
        where: {
          schoolId_gradeNumber_academicYearId: {
            schoolId,
            gradeNumber: dto.gradeNumber,
            academicYearId: dto.academicYearId,
          },
        },
      })
      if (existing) {
        throw new ConflictException(
          `Grade ${dto.gradeNumber} already exists for this school and academic year`,
        )
      }

      const grade = await this.prisma.grade.create({
        data: {
          schoolId,
          gradeNumber: dto.gradeNumber,
          name: dto.name,
          capsPhaseId: dto.capsPhaseId,
          academicYearId: dto.academicYearId,
        },
        include: {
          capsPhase: { select: { id: true, name: true } },
          academicYear: { select: { id: true, year: true } },
        },
      })

      return grade
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to create grade. Please verify all provided IDs are valid.')
    }
  }

  async findAll(schoolId: string, academicYearId?: string) {
    try {
      const where: any = { schoolId }
      if (academicYearId) {
        where.academicYearId = academicYearId
      }

      const grades = await this.prisma.grade.findMany({
        where,
        include: {
          capsPhase: { select: { id: true, name: true } },
          academicYear: { select: { id: true, year: true } },
        },
        orderBy: { gradeNumber: 'asc' },
      })

      return grades
    } catch (error) {
      throw new BadRequestException('Failed to retrieve grades')
    }
  }

  async findOne(id: string, schoolId: string) {
    try {
      const grade = await this.prisma.grade.findFirst({
        where: { id, schoolId },
        include: {
          capsPhase: { select: { id: true, name: true, gradeFrom: true, gradeTo: true } },
          academicYear: { select: { id: true, year: true, isCurrent: true } },
          classes: {
            select: { id: true, name: true, maxCapacity: true },
            orderBy: { name: 'asc' },
          },
        },
      })

      if (!grade) {
        throw new NotFoundException(`Grade with ID ${id} not found`)
      }

      return grade
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to retrieve grade with ID ${id}`)
    }
  }

  async update(id: string, schoolId: string, dto: UpdateGradeDto) {
    try {
      await this.findOne(id, schoolId)

      const updateData: any = {}
      if (dto.gradeNumber !== undefined) updateData.gradeNumber = dto.gradeNumber
      if (dto.name !== undefined) updateData.name = dto.name
      if (dto.capsPhaseId !== undefined) updateData.capsPhaseId = dto.capsPhaseId
      if (dto.academicYearId !== undefined) updateData.academicYearId = dto.academicYearId

      const grade = await this.prisma.grade.update({
        where: { id },
        data: updateData,
      })

      return grade
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to update grade')
    }
  }
}
