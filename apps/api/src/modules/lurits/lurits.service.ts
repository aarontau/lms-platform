/**
 * LURITS / SA-SAMS Export Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates export packages compatible with SA-SAMS / LURITS requirements.
 *
 * Export types:
 *   LEARNER_DATA   — biographical + guardian + enrolment data
 *   ATTENDANCE     — daily attendance records for a term
 *   MARKS          — assessment results per subject per learner
 *   EMIS_ANNUAL    — annual survey data package
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class LuritsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List export history ──────────────────────────────────────────────────

  async listBatches(schoolId: string) {
    return this.prisma.luritsExportBatch.findMany({
      where: { schoolId },
      include: {
        exportedBy: { select: { id: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  // ── Validate data before export ──────────────────────────────────────────

  async validate(schoolId: string, academicYearId: string, exportType: string) {
    const errors: string[] = []
    const warnings: string[] = []

    // Verify the academic year belongs to this school
    const ay = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    })
    if (!ay) throw new NotFoundException('Academic year not found')

    if (exportType === 'LEARNER_DATA' || exportType === 'EMIS_ANNUAL') {
      // Check for learners without LURITS numbers
      const noLurits = await this.prisma.learner.count({
        where: { schoolId, luritsNumber: null, status: 'ACTIVE' },
      })
      if (noLurits > 0) {
        warnings.push(`${noLurits} active learner(s) have no LURITS number — they will be exported as new registrations`)
      }

      // Check for learners with missing required fields
      const noId = await this.prisma.learner.count({
        where: { schoolId, idNumber: null, status: 'ACTIVE' },
      })
      if (noId > 0) {
        warnings.push(`${noId} learner(s) have no ID number on file`)
      }

      // Check for learners without guardians
      const learnersWithGuardians = await this.prisma.learnerGuardian.groupBy({
        by: ['learnerId'],
        where: { schoolId },
        _count: true,
      })
      const allLearners = await this.prisma.learner.count({
        where: { schoolId, status: 'ACTIVE' },
      })
      const learnersWithNoGuardian = allLearners - learnersWithGuardians.length
      if (learnersWithNoGuardian > 0) {
        warnings.push(`${learnersWithNoGuardian} learner(s) have no guardian linked`)
      }
    }

    if (exportType === 'ATTENDANCE') {
      const registerCount = await this.prisma.attendanceRegister.count({
        where: { schoolId, academicYear: { id: academicYearId } },
      })
      if (registerCount === 0) {
        errors.push('No attendance registers have been captured for this academic year')
      }
    }

    if (exportType === 'MARKS') {
      const markCount = await this.prisma.learnerMark.count({
        where: { schoolId },
      })
      if (markCount === 0) {
        errors.push('No assessment marks have been captured')
      }
    }

    const learnerCount = await this.prisma.learner.count({
      where: { schoolId, status: 'ACTIVE' },
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        learnerCount,
        academicYear: ay.year,
        exportType,
      },
    }
  }

  // ── Generate export ──────────────────────────────────────────────────────

  async generateExport(
    schoolId: string,
    academicYearId: string,
    exportType: string,
    userId: string,
  ) {
    const ay = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    })
    if (!ay) throw new NotFoundException('Academic year not found')

    // Create batch record (mark as PROCESSING)
    const batch = await this.prisma.luritsExportBatch.create({
      data: {
        schoolId,
        academicYearId,
        exportType: exportType as any,
        status: 'PROCESSING',
        exportedById: userId,
      },
    })

    try {
      let records: any[] = []
      let csvContent = ''

      if (exportType === 'LEARNER_DATA') {
        records = await this.buildLearnerDataExport(schoolId, academicYearId)
        csvContent = this.toLearnerCsv(records)
      } else if (exportType === 'ATTENDANCE') {
        records = await this.buildAttendanceExport(schoolId, academicYearId)
        csvContent = this.toAttendanceCsv(records)
      } else if (exportType === 'MARKS') {
        records = await this.buildMarksExport(schoolId, academicYearId)
        csvContent = this.toMarksCsv(records)
      } else if (exportType === 'EMIS_ANNUAL') {
        records = await this.buildEmisExport(schoolId, academicYearId)
        csvContent = this.toEmisAnnualCsv(records)
      } else {
        throw new BadRequestException(`Unknown export type: ${exportType}`)
      }

      // Update batch to COMPLETE
      const updatedBatch = await this.prisma.luritsExportBatch.update({
        where: { id: batch.id },
        data: {
          status: 'COMPLETE',
          recordCount: records.length,
          completedAt: new Date(),
        },
        include: {
          exportedBy: { select: { id: true, firstName: true, lastName: true } },
          academicYear: { select: { id: true, year: true } },
        },
      })

      return {
        batch: updatedBatch,
        csvContent,
        filename: `${exportType.toLowerCase()}_${ay.year}_${new Date().toISOString().split('T')[0]}.csv`,
        recordCount: records.length,
      }
    } catch (error) {
      // Mark batch as FAILED
      await this.prisma.luritsExportBatch.update({
        where: { id: batch.id },
        data: {
          status: 'FAILED',
          validationErrors: { error: (error as Error).message },
        },
      })
      throw error
    }
  }

  // ── Private: Data builders ────────────────────────────────────────────────

  private async buildLearnerDataExport(schoolId: string, academicYearId: string) {
    const learners = await this.prisma.learner.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: {
        learnerEnrolments: {
          where: { academicYearId, status: 'ACTIVE' },
          include: {
            grade: { select: { gradeNumber: true, name: true } },
            class: { select: { name: true } },
          },
          take: 1,
        },
        learnerGuardians: {
          where: { isPrimary: true },
          include: {
            guardian: {
              select: {
                firstName: true, lastName: true, phonePrimary: true,
                email: true, relationship: true, idNumber: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return learners.map((l) => {
      const enrolment = l.learnerEnrolments[0]
      const guardian  = l.learnerGuardians[0]?.guardian
      return {
        luritsNumber:    l.luritsNumber ?? '',
        studentNumber:   l.studentNumber,
        surname:         l.lastName,
        firstName:       l.firstName,
        middleName:      l.middleName ?? '',
        dateOfBirth:     l.dateOfBirth.toISOString().split('T')[0],
        gender:          l.gender,
        nationality:     l.nationality,
        homeLanguage:    l.homeLanguage,
        idNumber:        l.idNumber ?? '',
        idType:          l.idType ?? '',
        gradeNumber:     enrolment?.grade?.gradeNumber ?? '',
        className:       enrolment?.class?.name ?? '',
        admissionDate:   l.admissionDate.toISOString().split('T')[0],
        admissionNumber: l.admissionNumber ?? '',
        hasSpecialNeeds: l.hasSpecialNeeds ? 'YES' : 'NO',
        guardianSurname:   guardian?.lastName ?? '',
        guardianFirstName: guardian?.firstName ?? '',
        guardianPhone:     guardian?.phonePrimary ?? '',
        guardianEmail:     guardian?.email ?? '',
        guardianRelation:  guardian?.relationship ?? '',
        guardianIdNumber:  guardian?.idNumber ?? '',
      }
    })
  }

  private async buildAttendanceExport(schoolId: string, academicYearId: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        attendanceRegister: { academicYearId },
      },
      include: {
        attendanceRegister: {
          select: {
            date: true,
            class: { select: { name: true, grade: { select: { gradeNumber: true } } } },
          },
        },
        learner: {
          select: { luritsNumber: true, studentNumber: true, firstName: true, lastName: true },
        },
      },
      orderBy: { attendanceRegister: { date: 'asc' } },
    })

    return records.map((r) => ({
      date:          r.attendanceRegister.date.toISOString().split('T')[0],
      gradeNumber:   r.attendanceRegister.class.grade.gradeNumber,
      className:     r.attendanceRegister.class.name,
      luritsNumber:  r.learner.luritsNumber ?? '',
      studentNumber: r.learner.studentNumber,
      surname:       r.learner.lastName,
      firstName:     r.learner.firstName,
      status:        r.status,
      notes:         r.notes ?? '',
    }))
  }

  private async buildMarksExport(schoolId: string, academicYearId: string) {
    const marks = await this.prisma.learnerMark.findMany({
      where: { schoolId },
      include: {
        learner: {
          select: { luritsNumber: true, studentNumber: true, firstName: true, lastName: true },
        },
        assessmentTask: {
          select: {
            title: true, taskType: true, maxMark: true,
            subjectClass: {
              select: {
                schoolSubject: { select: { name: true, code: true } },
                class: { select: { name: true, grade: { select: { gradeNumber: true } } } },
              },
            },
          },
        },
      },
      orderBy: [{ learner: { lastName: 'asc' } }],
    })

    return marks.map((m) => ({
      luritsNumber:  m.learner.luritsNumber ?? '',
      studentNumber: m.learner.studentNumber,
      surname:       m.learner.lastName,
      firstName:     m.learner.firstName,
      gradeNumber:   m.assessmentTask.subjectClass.class.grade.gradeNumber,
      className:     m.assessmentTask.subjectClass.class.name,
      subjectCode:   m.assessmentTask.subjectClass.schoolSubject.code,
      subjectName:   m.assessmentTask.subjectClass.schoolSubject.name,
      taskTitle:     m.assessmentTask.title,
      taskType:      m.assessmentTask.taskType,
      rawMark:       m.isAbsent ? 'ABS' : (m.rawMark?.toString() ?? ''),
      maxMark:       m.maxMark.toString(),
      percentage:    m.isAbsent ? '' : (m.percentage?.toFixed(1) ?? ''),
      isAbsent:      m.isAbsent ? 'YES' : 'NO',
    }))
  }

  private async buildEmisExport(schoolId: string, academicYearId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true, emisNumber: true,
        province: { select: { name: true, code: true } },
        district: { select: { name: true } },
      },
    })

    const learnersByGrade = await this.prisma.learner.groupBy({
      by: ['gender'],
      where: { schoolId, status: 'ACTIVE' },
      _count: true,
    })

    const totalLearners = learnersByGrade.reduce((sum, r) => sum + r._count, 0)
    const totalMale   = learnersByGrade.find((r) => r.gender === 'MALE')?._count ?? 0
    const totalFemale = learnersByGrade.find((r) => r.gender === 'FEMALE')?._count ?? 0

    const enrolmentsByGrade = await this.prisma.learnerEnrolment.findMany({
      where: { schoolId, academicYearId, status: 'ACTIVE' },
      include: { grade: { select: { gradeNumber: true, name: true } } },
    })

    const gradeMap: Record<string, { grade: string; total: number }> = {}
    for (const e of enrolmentsByGrade) {
      const key = e.grade.gradeNumber.toString()
      if (!gradeMap[key]) gradeMap[key] = { grade: e.grade.name, total: 0 }
      gradeMap[key].total++
    }

    return [
      {
        emisNumber:    school?.emisNumber ?? '',
        schoolName:    school?.name ?? '',
        province:      school?.province?.name ?? '',
        district:      school?.district?.name ?? '',
        academicYear:  new Date().getFullYear(),
        totalLearners,
        totalMale,
        totalFemale,
        specialNeeds: 0,
        gradeBreakdown: JSON.stringify(gradeMap),
      },
    ]
  }

  // ── Private: CSV formatters ───────────────────────────────────────────────

  private csvRow(fields: any[]): string {
    return fields
      .map((f) => {
        const s = String(f ?? '')
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      })
      .join(',')
  }

  private toLearnerCsv(records: any[]): string {
    const header = this.csvRow([
      'LURITS_NUMBER', 'STUDENT_NUMBER', 'SURNAME', 'FIRST_NAME', 'MIDDLE_NAME',
      'DATE_OF_BIRTH', 'GENDER', 'NATIONALITY', 'HOME_LANGUAGE', 'ID_NUMBER', 'ID_TYPE',
      'GRADE', 'CLASS', 'ADMISSION_DATE', 'ADMISSION_NUMBER', 'SPECIAL_NEEDS',
      'GUARDIAN_SURNAME', 'GUARDIAN_FIRST_NAME', 'GUARDIAN_PHONE', 'GUARDIAN_EMAIL',
      'GUARDIAN_RELATION', 'GUARDIAN_ID',
    ])
    const rows = records.map((r) =>
      this.csvRow([
        r.luritsNumber, r.studentNumber, r.surname, r.firstName, r.middleName,
        r.dateOfBirth, r.gender, r.nationality, r.homeLanguage, r.idNumber, r.idType,
        r.gradeNumber, r.className, r.admissionDate, r.admissionNumber, r.hasSpecialNeeds,
        r.guardianSurname, r.guardianFirstName, r.guardianPhone, r.guardianEmail,
        r.guardianRelation, r.guardianIdNumber,
      ])
    )
    return [header, ...rows].join('\n')
  }

  private toAttendanceCsv(records: any[]): string {
    const header = this.csvRow([
      'DATE', 'GRADE', 'CLASS', 'LURITS_NUMBER', 'STUDENT_NUMBER',
      'SURNAME', 'FIRST_NAME', 'STATUS', 'NOTES',
    ])
    const rows = records.map((r) =>
      this.csvRow([
        r.date, r.gradeNumber, r.className, r.luritsNumber, r.studentNumber,
        r.surname, r.firstName, r.status, r.notes,
      ])
    )
    return [header, ...rows].join('\n')
  }

  private toMarksCsv(records: any[]): string {
    const header = this.csvRow([
      'LURITS_NUMBER', 'STUDENT_NUMBER', 'SURNAME', 'FIRST_NAME',
      'GRADE', 'CLASS', 'SUBJECT_CODE', 'SUBJECT_NAME',
      'TASK_TITLE', 'TASK_TYPE', 'RAW_MARK', 'MAX_MARK', 'PERCENTAGE', 'ABSENT',
    ])
    const rows = records.map((r) =>
      this.csvRow([
        r.luritsNumber, r.studentNumber, r.surname, r.firstName,
        r.gradeNumber, r.className, r.subjectCode, r.subjectName,
        r.taskTitle, r.taskType, r.rawMark, r.maxMark, r.percentage, r.isAbsent,
      ])
    )
    return [header, ...rows].join('\n')
  }

  private toEmisAnnualCsv(records: any[]): string {
    const header = this.csvRow([
      'EMIS_NUMBER', 'SCHOOL_NAME', 'PROVINCE', 'DISTRICT', 'ACADEMIC_YEAR',
      'TOTAL_LEARNERS', 'TOTAL_MALE', 'TOTAL_FEMALE', 'SPECIAL_NEEDS', 'GRADE_BREAKDOWN',
    ])
    const rows = records.map((r) =>
      this.csvRow([
        r.emisNumber, r.schoolName, r.province, r.district, r.academicYear,
        r.totalLearners, r.totalMale, r.totalFemale, r.specialNeeds, r.gradeBreakdown,
      ])
    )
    return [header, ...rows].join('\n')
  }
}
