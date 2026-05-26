import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { TimetableService } from './timetable.service'
import { CreatePeriodDto } from './dto/create-period.dto'
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Timetable')
@ApiBearerAuth()
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ─── Venues ──────────────────────────────────────────────────────────────────

  @Get('venues')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get all venues for this school' })
  findAllVenues(@Request() req: any) {
    return this.timetableService.findAllVenues(req.user.schoolId)
  }

  @Post('venues')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a venue (classroom, lab, etc.)' })
  createVenue(@Request() req: any, @Body() dto: { name: string; capacity: number; venueType: string }) {
    return this.timetableService.createVenue(req.user.schoolId, dto)
  }

  // ─── Periods ─────────────────────────────────────────────────────────────────

  @Get('periods')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiOperation({ summary: 'Get all configured periods for this school' })
  findAllPeriods(@Request() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.timetableService.findAllPeriods(req.user.schoolId, academicYearId)
  }

  @Post('periods')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new period' })
  @ApiResponse({ status: 201, description: 'Period created.' })
  createPeriod(@Request() req: any, @Body() dto: CreatePeriodDto) {
    return this.timetableService.createPeriod(req.user.schoolId, dto)
  }

  @Put('periods/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Update a period' })
  updatePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: Partial<CreatePeriodDto>,
  ) {
    return this.timetableService.updatePeriod(id, req.user.schoolId, dto)
  }

  @Delete('periods/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a period (fails if slots are assigned to it)' })
  deletePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.timetableService.deletePeriod(id, req.user.schoolId)
  }

  // ─── Timetable Slots ─────────────────────────────────────────────────────────

  @Get('slots')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiOperation({ summary: 'Get all timetable slots for this school' })
  findAllSlots(@Request() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.timetableService.findAllSlots(req.user.schoolId, academicYearId)
  }

  @Get('class/:classId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get timetable for a specific class' })
  @ApiQuery({ name: 'academicYearId', required: true })
  getClassTimetable(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Request() req: any,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.timetableService.findSlotsByClass(req.user.schoolId, classId, academicYearId)
  }

  @Get('teacher/:teacherId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get timetable for a specific teacher' })
  @ApiQuery({ name: 'academicYearId', required: true })
  getTeacherTimetable(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Request() req: any,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.timetableService.findSlotsByTeacher(req.user.schoolId, teacherId, academicYearId)
  }

  @Post('slots')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a subject class to a period (creates a timetable slot)' })
  @ApiResponse({ status: 201, description: 'Slot created.' })
  @ApiResponse({ status: 409, description: 'Teacher or venue conflict detected.' })
  createSlot(@Request() req: any, @Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.createSlot(req.user.schoolId, dto)
  }

  @Delete('slots/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a timetable slot' })
  deleteSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.timetableService.deleteSlot(id, req.user.schoolId)
  }
}
