/**
 * Assessment Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the full CAPS assessment lifecycle:
 *   Programme of Assessment (POA) → Tasks → Mark Capture → SBA Calculation
 *
 * Schema alignment notes (prisma/schema.prisma):
 *   - SBA result store: model TermSbaResult (field: sbaTotalPercentage)
 *   - Task types:       enum TaskType (DIAGNOSTIC, CLASS_TEST, …, SUMMATIVE_EXAM)
 *   - Enrolled roster:  LearnerEnrolment (where classId = …, status = ACTIVE)
 *   - Mark required FK: capturedById (teacher/admin who entered the mark)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePoaDto, PoaStatus } from './dto/create-poa.dto'
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto'
import { CaptureMarksDto } from './dto/capture-marks.dto'
import {
  calculateTermSba,
  getPhaseWeights,
  type TaskInput,
  type MarkInput,
} from './sba-calculator'

// ─── POA include shape (reused in list + getOne) ─────────────────────────────
const POA_INCLUDE = {
  subjectClass: {
    include: {
      schoolSubject: { include: { capsSubject: true } },
      class: { include: { grade: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  term: true,
  assessmentTasks: {
    orderBy: { createdAt: 'asc' as const },
    include: { _count: { select: { learnerMarks: true } } },
  },
  createdBy:  { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Programme of Assessment ────────────────────────────────────────────────

  async createPoa(schoolId: string, userId: string, dto: CreatePoaDto) {
    // Verify subject class belongs to this school
    const sc = await this.prisma.subjectClass.findFirst({
      where:   { id: dto.subjectClassId, schoolId },
      include: { schoolSubject: { include: { capsSubject: true } } },
    })
    if (!sc) throw new NotFoundException('Subject class not found')

    // Verify term belongs to this school
    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, academicYear: { schoolId } },
    })
    if (!term) throw new NotFoundException('Term not found')

    // One POA per subject class per term
    const existing = await this.prisma.programmeOfAssessment.findFirst({
      where: { subjectClassId: dto.subjectClassId, termId: dto.termId },
    })
    if (existing) {
      throw new ConflictException(
        'A Programme of Assessment already exists for this class in this term'
      )
    }

    return this.prisma.programmeOfAssessment.create({
      data: {
        schoolId,
        subjectClassId:      dto.subjectClassId,
        termId:              dto.termId,
        totalTasksRequired:  dto.totalTasksRequired ?? 0,
        status:              dto.status ?? PoaStatus.DRAFT,
        createdById:         userId,
      },
      include: POA_INCLUDE,
    })
  }

  async listPoas(schoolId: string, filters: {
    subjectClassId?: string
    termId?:         string
    status?:         PoaStatus
  }) {
    return this.prisma.programmeOfAssessment.findMany({
      where: {
        schoolId,
        subjectClassId: filters.subjectClassId,
        termId:         filters.termId,
        status:         filters.status,
      },
      include:  POA_INCLUDE,
      orderBy:  [{ term: { startDate: 'asc' } }, { createdAt: 'asc' }],
    })
  }

  async getOnePoa(id: string, schoolId: string) {
    const poa = await this.prisma.programmeOfAssessment.findFirst({
      where:   { id, schoolId },
      include: POA_INCLUDE,
    })
    if (!poa) throw new NotFoundException('Programme of Assessment not found')
    return poa
  }

  /**
   * Advance POA status: DRAFT → SUBMITTED → APPROVED.
   * Backward transitions are blocked.
   */
  async updatePoaStatus(
    id:        string,
    schoolId:  string,
    userId:    string,
    newStatus: PoaStatus,
  ) {
    const poa = await this.prisma.programmeOfAssessment.findFirst({
      where: { id, schoolId },
    })
    if (!poa) throw new NotFoundException('Programme of Assessment not found')

    const order = [PoaStatus.DRAFT, PoaStatus.SUBMITTED, PoaStatus.APPROVED]
    const currentIdx = order.indexOf(poa.status as PoaStatus)
    const newIdx     = order.indexOf(newStatus)

    if (newIdx <= currentIdx) {
      throw new BadRequestException(
        `Cannot move POA from ${poa.status} to ${newStatus} — forward-only transitions`
      )
    }

    const updateData: any = { status: newStatus }
    if (newStatus === PoaStatus.APPROVED) {
      updateData.approvedById = userId
    }

    return this.prisma.programmeOfAssessment.update({
      where: { id },
      data:  updateData,
    })
  }

  // ─── Assessment Tasks ───────────────────────────────────────────────────────

  async createTask(schoolId: string, userId: string, dto: CreateTaskDto) {
    // Verify POA exists and belongs to this school
    const poa = await this.prisma.programmeOfAssessment.findFirst({
      where:   { id: dto.programmeOfAssessmentId, schoolId },
      include: { assessmentTasks: { select: { weightInSba: true } } },
    })
    if (!poa) throw new NotFoundException('Programme of Assessment not found')

    if (poa.status === PoaStatus.APPROVED) {
      throw new ForbiddenException('Cannot add tasks to an approved POA')
    }

    // Guard: weights must sum to ≤ 100
    const existingWeight = poa.assessmentTasks.reduce(
      (sum, t) => sum + Number(t.weightInSba), 0
    )
    if (existingWeight + dto.weightInSba > 100) {
      throw new BadRequestException(
        `Adding this task (weight ${dto.weightInSba}%) would bring the total to ` +
        `${existingWeight + dto.weightInSba}%. Tasks in a POA must sum to exactly 100%.`
      )
    }

    return this.prisma.assessmentTask.create({
      data: {
        schoolId,
        programmeOfAssessmentId: dto.programmeOfAssessmentId,
        subjectClassId:          poa.subjectClassId,
        termId:                  poa.termId,
        title:                   dto.title,
        taskType:                dto.taskType as any,
        maxMark:                 dto.maxMark,
        weightInSba:             dto.weightInSba,
        isExam:                  dto.isExam,
        dueDate:                 dto.dueDate ? new Date(dto.dueDate) : undefined,
        instructions:            dto.instructions,
        createdById:             userId,
      },
    })
  }

  async updateTask(id: string, schoolId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.assessmentTask.findFirst({
      where:   { id, schoolId },
      include: { programmeOfAssessment: true },
    })
    if (!task) throw new NotFoundException('Assessment task not found')

    if (task.programmeOfAssessment.status === PoaStatus.APPROVED) {
      throw new ForbiddenException('Cannot edit tasks in an approved POA')
    }

    return this.prisma.assessmentTask.update({
      where: { id },
      data: {
        title:        dto.title,
        taskType:     dto.taskType as any,
        maxMark:      dto.maxMark,
        weightInSba:  dto.weightInSba,
        dueDate:      dto.dueDate ? new Date(dto.dueDate) : undefined,
        instructions: dto.instructions,
      },
    })
  }

  async deleteTask(id: string, schoolId: string) {
    const task = await this.prisma.assessmentTask.findFirst({
      where:   { id, schoolId },
      include: {
        programmeOfAssessment: true,
        _count: { select: { learnerMarks: true } },
      },
    })
    if (!task) throw new NotFoundException('Assessment task not found')

    if (task.programmeOfAssessment.status === PoaStatus.APPROVED) {
      throw new ForbiddenException('Cannot delete tasks from an approved POA')
    }

    if (task._count.learnerMarks > 0) {
      throw new ConflictException(
        `Cannot delete — ${task._count.learnerMarks} marks have been captured for this task`
      )
    }

    return this.prisma.assessmentTask.delete({ where: { id } })
  }

  // ─── Mark Capture ───────────────────────────────────────────────────────────

  /**
   * Upserts learner marks for one assessment task, then recalculates
   * TermSbaResult for every affected learner.
   *
   * Idempotent — safe to call multiple times (last write wins).
   */
  async captureMarks(schoolId: string, userId: string, dto: CaptureMarksDto) {
    const task = await this.prisma.assessmentTask.findFirst({
      where:   { id: dto.assessmentTaskId, schoolId },
      include: { programmeOfAssessment: true },
    })
    if (!task) throw new NotFoundException('Assessment task not found')

    // Validate: no rawMark may exceed task.maxMark
    for (const m of dto.marks) {
      if (m.rawMark != null && m.rawMark > Number(task.maxMark)) {
        throw new BadRequestException(
          `Mark ${m.rawMark} exceeds task maximum of ${task.maxMark}`
        )
      }
    }

    const now = new Date()

    // Upsert each mark inside a single transaction
    await this.prisma.$transaction(
      dto.marks.map((m) =>
        this.prisma.learnerMark.upsert({
          where: {
            assessmentTaskId_learnerId: {
              assessmentTaskId: dto.assessmentTaskId,
              learnerId:        m.learnerId,
            },
          },
          create: {
            schoolId,
            assessmentTaskId: dto.assessmentTaskId,
            learnerId:        m.learnerId,
            rawMark:          m.rawMark ?? null,
            maxMark:          task.maxMark,   // denormalised for reporting
            percentage:       m.rawMark != null
              ? (m.rawMark / Number(task.maxMark)) * 100
              : null,
            isAbsent:         m.isAbsent,
            isExempted:       m.isExempted,
            notes:            m.notes,
            capturedById:     userId,
            capturedAt:       now,
          },
          update: {
            rawMark:       m.rawMark ?? null,
            percentage:    m.rawMark != null
              ? (m.rawMark / Number(task.maxMark)) * 100
              : null,
            isAbsent:      m.isAbsent,
            isExempted:    m.isExempted,
            notes:         m.notes,
            capturedById:  userId,
            capturedAt:    now,
          },
        })
      )
    )

    // Recalculate SBA for affected learners
    const learnerIds = dto.marks.map((m) => m.learnerId)
    await this.recalculateTermSba(
      task.programmeOfAssessmentId,
      task.subjectClassId,
      task.termId,
      learnerIds,
      schoolId,
    )

    return { captured: dto.marks.length, taskId: dto.assessmentTaskId }
  }

  /** Returns all marks for a task — used for the inline markbook grid. */
  async getTaskMarks(taskId: string, schoolId: string) {
    const task = await this.prisma.assessmentTask.findFirst({
      where: { id: taskId, schoolId },
    })
    if (!task) throw new NotFoundException('Assessment task not found')

    return this.prisma.learnerMark.findMany({
      where:   { assessmentTaskId: taskId },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
          },
        },
      },
      orderBy: { learner: { lastName: 'asc' } },
    })
  }

  // ─── Markbook ───────────────────────────────────────────────────────────────

  /**
   * Full markbook for a POA:
   *  - All enrolled (ACTIVE) learners for the class
   *  - All assessment tasks as columns
   *  - Per-cell raw marks with absent/exempted flags
   *  - Live SBA% per learner (recalculated, not stale cache)
   *  - Class average per task
   *  - Phase SBA/Exam weights for display
   */
  async getMarkbook(poaId: string, schoolId: string) {
    const poa = await this.prisma.programmeOfAssessment.findFirst({
      where: { id: poaId, schoolId },
      include: {
        assessmentTasks: { orderBy: { createdAt: 'asc' } },
        subjectClass: {
          include: {
            schoolSubject: { include: { capsSubject: true } },
            class: {
              include: { grade: true },
            },
          },
        },
        term: true,
      },
    })
    if (!poa) throw new NotFoundException('Programme of Assessment not found')

    const tasks    = poa.assessmentTasks
    const classId  = poa.subjectClass.classId
    const grade    = poa.subjectClass.class.grade

    // Fetch active enrolments for this class (current academic year implied)
    const enrolments = await this.prisma.learnerEnrolment.findMany({
      where: { classId, status: 'ACTIVE' as any },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
          },
        },
      },
      orderBy: { learner: { lastName: 'asc' } },
    })

    // Load all marks for this POA in one query
    const allMarks = await this.prisma.learnerMark.findMany({
      where: {
        assessmentTaskId: { in: tasks.map((t) => t.id) },
      },
    })

    // Build lookup: learnerId → taskId → mark
    type MarkRow = typeof allMarks[0]
    const markMap = new Map<string, Map<string, MarkRow>>()
    for (const mark of allMarks) {
      if (!markMap.has(mark.learnerId)) markMap.set(mark.learnerId, new Map())
      markMap.get(mark.learnerId)!.set(mark.assessmentTaskId, mark)
    }

    // Build learner rows
    const rows = enrolments.map(({ learner }) => {
      const taskInputs: TaskInput[] = tasks.map((t) => ({
        id:          t.id,
        maxMark:     Number(t.maxMark),
        weightInSba: Number(t.weightInSba),
        isExam:      t.isExam,
      }))
      const markInputs: MarkInput[] = tasks.map((t) => {
        const m = markMap.get(learner.id)?.get(t.id)
        return {
          assessmentTaskId: t.id,
          rawMark:          m ? (m.rawMark !== null ? Number(m.rawMark) : null) : null,
          isAbsent:         m?.isAbsent  ?? false,
          isExempted:       m?.isExempted ?? false,
        }
      })

      const sbaResult = calculateTermSba(taskInputs, markInputs)

      const marksByTask: Record<string, {
        rawMark:    number | null
        isAbsent:   boolean
        isExempted: boolean
        notes?:     string | null
      }> = {}
      for (const t of tasks) {
        const m = markMap.get(learner.id)?.get(t.id)
        marksByTask[t.id] = {
          rawMark:    m ? (m.rawMark !== null ? Number(m.rawMark) : null) : null,
          isAbsent:   m?.isAbsent  ?? false,
          isExempted: m?.isExempted ?? false,
          notes:      m?.notes,
        }
      }

      return {
        learner,
        marks:          marksByTask,
        sbaPercentage:  sbaResult.sbaPercentage,
        tasksCompleted: sbaResult.tasksCompleted,
        isAtRisk:       sbaResult.isAtRisk,
      }
    })

    // Class averages per task (only valid marks included)
    const taskAverages: Record<string, number | null> = {}
    for (const task of tasks) {
      const validPcts = rows
        .map((r) => r.marks[task.id])
        .filter((m) => m && !m.isAbsent && !m.isExempted && m.rawMark !== null)
        .map((m) => (m!.rawMark! / Number(task.maxMark)) * 100)

      taskAverages[task.id] = validPcts.length > 0
        ? Math.round(
            (validPcts.reduce((a, b) => a + b, 0) / validPcts.length) * 100
          ) / 100
        : null
    }

    const weights = getPhaseWeights(grade?.gradeNumber ?? 8)

    return {
      poa: {
        id:     poa.id,
        status: poa.status,
        subject: (poa.subjectClass as any).schoolSubject,
        grade,
        term:   poa.term,
      },
      tasks,
      rows,
      taskAverages,
      sbaWeight:  weights.sba,
      examWeight: weights.exam,
      totalLearners:  rows.length,
      atRiskCount:    rows.filter((r) => r.isAtRisk).length,
    }
  }

  // ─── At-Risk Learners ───────────────────────────────────────────────────────

  /** Returns learners with SBA < 40% for a given subject class. */
  async getAtRiskLearners(subjectClassId: string, schoolId: string) {
    return this.prisma.termSbaResult.findMany({
      where:   { subjectClassId, isAtRisk: true, schoolId },
      include: {
        learner: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
          },
        },
        term: true,
      },
      orderBy: { sbaTotalPercentage: 'asc' },
    })
  }

  // ─── SBA Recalculation (internal) ──────────────────────────────────────────

  /**
   * Recalculates and persists TermSbaResult for each learner after mark entry.
   * Called automatically inside captureMarks — not exposed via HTTP.
   */
  private async recalculateTermSba(
    poaId:          string,
    subjectClassId: string,
    termId:         string,
    learnerIds:     string[],
    schoolId:       string,
  ) {
    const tasks = await this.prisma.assessmentTask.findMany({
      where: { programmeOfAssessmentId: poaId },
    })

    const taskInputs: TaskInput[] = tasks.map((t) => ({
      id:          t.id,
      maxMark:     Number(t.maxMark),
      weightInSba: Number(t.weightInSba),
      isExam:      t.isExam,
    }))

    for (const learnerId of learnerIds) {
      const marks = await this.prisma.learnerMark.findMany({
        where: {
          learnerId,
          assessmentTask: { programmeOfAssessmentId: poaId },
        },
      })

      const markInputs: MarkInput[] = marks.map((m) => ({
        assessmentTaskId: m.assessmentTaskId,
        rawMark:          m.rawMark !== null ? Number(m.rawMark) : null,
        isAbsent:         m.isAbsent,
        isExempted:       m.isExempted,
      }))

      const result = calculateTermSba(taskInputs, markInputs)

      await this.prisma.termSbaResult.upsert({
        where: {
          schoolId_learnerId_subjectClassId_termId: {
            schoolId,
            learnerId,
            subjectClassId,
            termId,
          },
        },
        create: {
          schoolId,
          learnerId,
          subjectClassId,
          termId,
          sbaTotalPercentage: result.sbaPercentage,
          tasksCompleted:     result.tasksCompleted,
          tasksTotal:         result.tasksTotal,
          isAtRisk:           result.isAtRisk,
        },
        update: {
          sbaTotalPercentage: result.sbaPercentage,
          tasksCompleted:     result.tasksCompleted,
          tasksTotal:         result.tasksTotal,
          isAtRisk:           result.isAtRisk,
        },
      })
    }
  }
}
