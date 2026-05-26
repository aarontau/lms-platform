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
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly svc: AssessmentService) {}

  // ─── POA ───────────────────────────────────────────────────────────────────

  @Post('poa')
  @Roles('ADMIN', 'TEACHER')
  createPoa(@CurrentUser() user: any, @Body() dto: CreatePoaDto) {
    return this.svc.createPoa(user.schoolId, user.id, dto)
  }

  @Get('poa')
  @Roles('ADMIN', 'TEACHER', 'HOD')
  listPoas(
    @CurrentUser() user: any,
    @Query('subjectClassId') subjectClassId?: string,
    @Query('termId')         termId?:         string,
    @Query('status')         status?:         PoaStatus,
  ) {
    return this.svc.listPoas(user.schoolId, { subjectClassId, termId, status })
  }

  @Get('poa/:id')
  @Roles('ADMIN', 'TEACHER', 'HOD')
  getOnePoa(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.getOnePoa(id, user.schoolId)
  }

  @Patch('poa/:id/status')
  @Roles('ADMIN', 'HOD')
  updatePoaStatus(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PoaStatus,
  ) {
    return this.svc.updatePoaStatus(id, user.schoolId, user.id, status)
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  @Post('tasks')
  @Roles('ADMIN', 'TEACHER')
  createTask(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.svc.createTask(user.schoolId, user.id, dto)
  }

  @Patch('tasks/:id')
  @Roles('ADMIN', 'TEACHER')
  updateTask(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.svc.updateTask(id, user.schoolId, dto)
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'TEACHER')
  deleteTask(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.deleteTask(id, user.schoolId)
  }

  // ─── Mark Capture ──────────────────────────────────────────────────────────

  @Post('marks')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'TEACHER')
  captureMarks(@CurrentUser() user: any, @Body() dto: CaptureMarksDto) {
    return this.svc.captureMarks(user.schoolId, user.id, dto)
  }

  @Get('marks/:taskId')
  @Roles('ADMIN', 'TEACHER', 'HOD')
  getTaskMarks(
    @CurrentUser() user: any,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.svc.getTaskMarks(taskId, user.schoolId)
  }

  // ─── Markbook ──────────────────────────────────────────────────────────────

  @Get('markbook/:poaId')
  @Roles('ADMIN', 'TEACHER', 'HOD')
  getMarkbook(
    @CurrentUser() user: any,
    @Param('poaId', ParseUUIDPipe) poaId: string,
  ) {
    return this.svc.getMarkbook(poaId, user.schoolId)
  }

  // ─── At-Risk ───────────────────────────────────────────────────────────────

  @Get('at-risk/:subjectClassId')
  @Roles('ADMIN', 'TEACHER', 'HOD')
  getAtRiskLearners(
    @CurrentUser() user: any,
    @Param('subjectClassId', ParseUUIDPipe) subjectClassId: string,
  ) {
    return this.svc.getAtRiskLearners(subjectClassId, user.schoolId)
  }
}
