import {
  Controller, Get, Post,
  Body, Param, Query, Request,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AttendanceService } from './attendance.service'
import { CreateAttendanceRegisterDto } from './dto/create-attendance-register.dto'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Registers ───────────────────────────────────────────────────────────────

  @Get('registers')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'List attendance registers with optional filters' })
  @ApiQuery({ name: 'classId',    required: false })
  @ApiQuery({ name: 'termId',     required: false })
  @ApiQuery({ name: 'startDate',  required: false })
  @ApiQuery({ name: 'endDate',    required: false })
  @ApiQuery({ name: 'page',       required: false })
  @ApiQuery({ name: 'limit',      required: false })
  listRegisters(
    @Request() req: any,
    @Query('classId')   classId?:   string,
    @Query('termId')    termId?:    string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
  ) {
    return this.attendanceService.listRegisters(req.user.schoolId, {
      classId, termId, startDate, endDate,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Post('registers')
  @Roles(Role.TEACHER, Role.HOD, Role.PRINCIPAL, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Open an attendance register for a class on a date',
    description: 'Creates the register and pre-populates all enrolled learners as PRESENT. Returns existing register if already created.',
  })
  getOrCreateRegister(@Request() req: any, @Body() dto: CreateAttendanceRegisterDto) {
    return this.attendanceService.getOrCreateRegister(req.user.schoolId, req.user.id, dto)
  }

  @Get('registers/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get a specific register with all attendance records' })
  getRegister(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.attendanceService.getRegister(id, req.user.schoolId)
  }

  @Post('registers/:id/mark')
  @Roles(Role.TEACHER, Role.HOD, Role.PRINCIPAL, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Submit attendance marks for a register',
    description: 'Accepts an array of learner statuses. Upserts each record — safe to call multiple times.',
  })
  markAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(id, req.user.schoolId, dto)
  }

  // ─── Lookup by class + date ───────────────────────────────────────────────────

  @Get('registers/by-class')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiQuery({ name: 'classId', required: true })
  @ApiQuery({ name: 'date',    required: true, description: 'ISO date e.g. 2026-05-26' })
  @ApiOperation({ summary: 'Get register for a class on a specific date' })
  getRegisterByClassDate(
    @Request() req: any,
    @Query('classId') classId: string,
    @Query('date')    date:    string,
  ) {
    return this.attendanceService.getRegisterByClassDate(req.user.schoolId, classId, date)
  }

  // ─── Summary Reports ─────────────────────────────────────────────────────────

  @Get('summary/learner/:learnerId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiQuery({ name: 'termId', required: false })
  @ApiOperation({ summary: 'Get attendance summary for a learner' })
  getLearnerSummary(
    @Param('learnerId', ParseUUIDPipe) learnerId: string,
    @Request() req: any,
    @Query('termId') termId?: string,
  ) {
    return this.attendanceService.getLearnerSummary(req.user.schoolId, learnerId, termId)
  }

  @Get('summary/class/:classId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiQuery({ name: 'termId', required: false })
  @ApiOperation({ summary: 'Get attendance summary for all learners in a class' })
  getClassSummary(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Request() req: any,
    @Query('termId') termId?: string,
  ) {
    return this.attendanceService.getClassSummary(req.user.schoolId, classId, termId)
  }

  @Get('pending')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiQuery({ name: 'date',           required: true  })
  @ApiQuery({ name: 'academicYearId', required: true  })
  @ApiOperation({ summary: 'Get classes that have not captured an attendance register for the given date' })
  getPendingRegisters(
    @Request() req: any,
    @Query('date')           date:           string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.attendanceService.getPendingRegisters(req.user.schoolId, date, academicYearId)
  }
}
