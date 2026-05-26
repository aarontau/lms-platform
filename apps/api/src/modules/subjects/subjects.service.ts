import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateSchoolSubjectDto } from './dto/create-school-subject.dto'
import { CreateSubjectClassDto } from './dto/create-subject-class.dto'

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CAPS Catalogue ──────────────────────────────────────────────────────────

  async getCapsSubjects() {
    return this.prisma.capsSubject.findMany({
      where: { isActive: true },
      include: {
        capsPhase: { select: { id: true, name: true, gradeFrom: true, gradeTo: true } },
      },
      orderBy: [{ capsPhaseId: 'asc' }, { name: 'asc' }],
    })
  }

  // ─── School Subjects ─────────────────────────────────────────────────────────

  async findAllSchoolSubjects(schoolId: string) {
    return this.prisma.schoolSubject.findMany({
      where: { schoolId },
      include: {
        capsSubject: {
          select: {
            id: true, name: true, code: true, isCompulsory: true, subjectGroup: true,
            capsPhase: { select: { id: true, name: true, gradeFrom: true, gradeTo: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async createSchoolSubject(schoolId: string, dto: CreateSchoolSubjectDto) {
    // Verify CAPS subject exists
    const capsSubject = await this.prisma.capsSubject.findUnique({ where: { id: dto.capsSubjectId } })
    if (!capsSubject) throw new NotFoundException(`CAPS subject ${dto.capsSubjectId} not found`)

    // Prevent duplicates
    const existing = await this.prisma.schoolSubject.findFirst({
      where: { schoolId, capsSubjectId: dto.capsSubjectId },
    })
    if (existing) throw new ConflictException('This CAPS subject is already configured for your school')

    return this.prisma.schoolSubject.create({
      data: {
        schoolId,
        capsSubjectId: dto.capsSubjectId,
        name: dto.name,
        code: dto.code,
        isActive: dto.isActive ?? true,
      },
      include: {
        capsSubject: { select: { id: true, name: true, code: true, subjectGroup: true } },
      },
    })
  }

  async toggleSchoolSubject(id: string, schoolId: string, isActive: boolean) {
    await this.verifySchoolSubjectBelongsToSchool(id, schoolId)
    return this.prisma.schoolSubject.update({
      where: { id },
      data: { isActive },
    })
  }

  private async verifySchoolSubjectBelongsToSchool(id: string, schoolId: string) {
    const subject = await this.prisma.schoolSubject.findFirst({ where: { id, schoolId } })
    if (!subject) throw new NotFoundException(`School subject ${id} not found`)
    return subject
  }

  // ─── Subject Classes ─────────────────────────────────────────────────────────

  async findAllSubjectClasses(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    return this.prisma.subjectClass.findMany({
      where,
      include: {
        schoolSubject: { select: { id: true, name: true, code: true } },
        class: {
          select: { id: true, name: true,
            grade: { select: { id: true, gradeNumber: true, name: true } } },
        },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        academicYear: { select: { id: true, year: true } },
      },
      orderBy: [{ class: { grade: { gradeNumber: 'asc' } } }, { schoolSubject: { name: 'asc' } }],
    })
  }

  async createSubjectClass(schoolId: string, dto: CreateSubjectClassDto) {
    // Verify all foreign keys belong to this school
    const [subject, cls, teacher, year] = await Promise.all([
      this.prisma.schoolSubject.findFirst({ where: { id: dto.schoolSubjectId, schoolId } }),
      this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } }),
      this.prisma.user.findFirst({ where: { id: dto.teacherId, schoolId } }),
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
    ])

    if (!subject) throw new NotFoundException(`School subject ${dto.schoolSubjectId} not found`)
    if (!cls)     throw new NotFoundException(`Class ${dto.classId} not found`)
    if (!teacher) throw new NotFoundException(`Teacher ${dto.teacherId} not found`)
    if (!year)    throw new NotFoundException(`Academic year ${dto.academicYearId} not found`)

    // Check for duplicate
    const existing = await this.prisma.subjectClass.findUnique({
      where: {
        schoolId_schoolSubjectId_classId_academicYearId: {
          schoolId,
          schoolSubjectId: dto.schoolSubjectId,
          classId: dto.classId,
          academicYearId: dto.academicYearId,
        },
      },
    })
    if (existing) throw new ConflictException('This subject is already assigned to this class for the selected year')

    return this.prisma.subjectClass.create({
      data: {
        schoolId,
        schoolSubjectId: dto.schoolSubjectId,
        classId: dto.classId,
        teacherId: dto.teacherId,
        academicYearId: dto.academicYearId,
      },
      include: {
        schoolSubject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async updateSubjectClassTeacher(id: string, schoolId: string, teacherId: string) {
    const sc = await this.prisma.subjectClass.findFirst({ where: { id, schoolId } })
    if (!sc) throw new NotFoundException(`Subject class ${id} not found`)

    const teacher = await this.prisma.user.findFirst({ where: { id: teacherId, schoolId } })
    if (!teacher) throw new NotFoundException(`Teacher ${teacherId} not found`)

    return this.prisma.subjectClass.update({ where: { id }, data: { teacherId } })
  }

  async deleteSubjectClass(id: string, schoolId: string) {
    const sc = await this.prisma.subjectClass.findFirst({ where: { id, schoolId } })
    if (!sc) throw new NotFoundException(`Subject class ${id} not found`)

    // Check for dependent timetable slots or assessment tasks
    const [slots, tasks] = await Promise.all([
      this.prisma.timetableSlot.count({ where: { subjectClassId: id } }),
      this.prisma.assessmentTask.count({ where: { subjectClassId: id } }),
    ])

    if (slots > 0) throw new BadRequestException(`Cannot delete: ${slots} timetable slot(s) reference this subject class`)
    if (tasks > 0) throw new BadRequestException(`Cannot delete: ${tasks} assessment task(s) reference this subject class`)

    return this.prisma.subjectClass.delete({ where: { id } })
  }

  // ─── For teacher's own subject classes ───────────────────────────────────────

  async findByTeacher(teacherId: string, schoolId: string, academicYearId?: string) {
    const where: any = { teacherId, schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    return this.prisma.subjectClass.findMany({
      where,
      include: {
        schoolSubject: { select: { id: true, name: true, code: true } },
        class: {
          select: {
            id: true, name: true,
            grade: { select: { id: true, gradeNumber: true, name: true } },
            learnerEnrolments: {
              where: { status: 'ACTIVE' },
              select: { learnerId: true },
            },
          },
        },
        academicYear: { select: { id: true, year: true } },
      },
      orderBy: [{ class: { grade: { gradeNumber: 'asc' } } }, { schoolSubject: { name: 'asc' } }],
    })
  }
}
