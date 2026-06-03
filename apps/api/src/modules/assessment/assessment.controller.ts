/**
 * Assessment Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Route map:
 *
 *   POST   /assessment/poa                       Create POA
 *   GET    /assessment/poa                       List POAs (with filters)
 *   GET    /assessment/poa/:id                   Get one POA
 *   PATCH  /assessment/poa/:id/status            Advance POA status
 *
 *   POST   /assessment/tasks                     Create task
 *   PATCH  /assessment/tasks/:id                 Update task
 *   DELETE /assessment/tasks/:id                 Delete task
 *
 *   POST   /assessment/marks             200     Capture / update marks
 *   GET    /assessment/marks/:taskId             Marks for a task
 *
 *   GET    /assessment/markbook/:poaId           Full markbook
 *   GET    /assessment/at-risk/:subjectClassId   At-risk learners
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { AssessmentService } from './assessment.service'
import { CreatePoaDto, PoaStatus } from './dto/create-poa.dto'
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto'
import { CaptureMarksDto } from './dto/capture-marks.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

const ADMIN_ROLES  = [Role.SCHOOL_ADMIN, Role.PRINCIPAL] as const
const STAFF_ROLES  = [Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.TEACHER] as const
const HOD_ROLES    = [Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD] as const
const ALL_ROLES    = [Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER] as const

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly svc: AssessmentService) {}

  // ─── POA ───────────────────────────────────────────────────────────────────

  @Post('poa')
  @Roles(...STAFF_ROLES)
  createPoa(@CurrentUser() user: any, @Body() dto: CreatePoaDto) {
    return this.svc.createPoa(user.schoolId, user.id, dto)
  }

  @Get('poa')
  @Roles(...ALL_ROLES)
  listPoas(
    @CurrentUser() user: any,
    @Query('subjectClassId') subjectClassId?: string,
    @Query('termId')         termId?:         string,
    @Query('status')         status?:         PoaStatus,
  ) {
    return this.svc.listPoas(user.schoolId, { subjectClassId, termId, status })
  }

  @Get('poa/:id')
  @Roles(...ALL_ROLES)
  getOnePoa(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.getOnePoa(id, user.schoolId)
  }

  @Patch('poa/:id/status')
  @Roles(...HOD_ROLES)
  updatePoaStatus(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PoaStatus,
  ) {
    return this.svc.updatePoaStatus(id, user.schoolId, user.id, status)
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  @Post('tasks')
  @Roles(...STAFF_ROLES)
  createTask(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.svc.createTask(user.schoolId, user.id, dto)
  }

  @Patch('tasks/:id')
  @Roles(...STAFF_ROLES)
  updateTask(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.svc.updateTask(id, user.schoolId, dto)
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...STAFF_ROLES)
  deleteTask(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.deleteTask(id, user.schoolId)
  }

  // ─── Mark Capture ──────────────────────────────────────────────────────────

  @Post('marks')
  @HttpCode(HttpStatus.OK)
  @Roles(...STAFF_ROLES)
  captureMarks(@CurrentUser() user: any, @Body() dto: CaptureMarksDto) {
    return this.svc.captureMarks(user.schoolId, user.id, dto)
  }

  @Get('marks/:taskId')
  @Roles(...ALL_ROLES)
  getTaskMarks(
    @CurrentUser() user: any,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.svc.getTaskMarks(taskId, user.schoolId)
  }

  // ─── Markbook ──────────────────────────────────────────────────────────────

  @Get('markbook/:poaId')
  @Roles(...ALL_ROLES)
  getMarkbook(
    @CurrentUser() user: any,
    @Param('poaId', ParseUUIDPipe) poaId: string,
  ) {
    return this.svc.getMarkbook(poaId, user.schoolId)
  }

  // ─── At-Risk ───────────────────────────────────────────────────────────────

  @Get('at-risk/:subjectClassId')
  @Roles(...ALL_ROLES)
  getAtRiskLearners(
    @CurrentUser() user: any,
    @Param('subjectClassId', ParseUUIDPipe) subjectClassId: string,
  ) {
    return this.svc.getAtRiskLearners(subjectClassId, user.schoolId)
  }
}
