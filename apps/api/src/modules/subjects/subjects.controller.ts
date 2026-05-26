import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { SubjectsService } from './subjects.service'
import { CreateSchoolSubjectDto } from './dto/create-school-subject.dto'
import { CreateSubjectClassDto } from './dto/create-subject-class.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller()
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // ─── CAPS Catalogue ──────────────────────────────────────────────────────────

  @Get('subjects/caps')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get full CAPS subject catalogue' })
  getCapsSubjects() {
    return this.subjectsService.getCapsSubjects()
  }

  // ─── School Subjects ─────────────────────────────────────────────────────────

  @Get('subjects')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get school subjects (configured subjects for this school)' })
  findAllSchoolSubjects(@Request() req: any) {
    return this.subjectsService.findAllSchoolSubjects(req.user.schoolId)
  }

  @Post('subjects')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a CAPS subject to this school' })
  @ApiResponse({ status: 201, description: 'School subject created.' })
  @ApiResponse({ status: 409, description: 'Subject already configured for this school.' })
  createSchoolSubject(@Request() req: any, @Body() dto: CreateSchoolSubjectDto) {
    return this.subjectsService.createSchoolSubject(req.user.schoolId, dto)
  }

  @Put('subjects/:id/toggle')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Activate or deactivate a school subject' })
  toggleSchoolSubject(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body('isActive') isActive: boolean,
  ) {
    return this.subjectsService.toggleSchoolSubject(id, req.user.schoolId, isActive)
  }

  // ─── Subject Classes ─────────────────────────────────────────────────────────

  @Get('subject-classes')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get all subject-class-teacher assignments' })
  @ApiQuery({ name: 'academicYearId', required: false })
  findAllSubjectClasses(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.subjectsService.findAllSubjectClasses(req.user.schoolId, academicYearId)
  }

  @Post('subject-classes')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a subject to a class with a teacher' })
  @ApiResponse({ status: 201, description: 'Subject class created.' })
  @ApiResponse({ status: 409, description: 'Already assigned.' })
  createSubjectClass(@Request() req: any, @Body() dto: CreateSubjectClassDto) {
    return this.subjectsService.createSubjectClass(req.user.schoolId, dto)
  }

  @Put('subject-classes/:id/teacher')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiOperation({ summary: 'Reassign teacher for a subject class' })
  updateSubjectClassTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body('teacherId') teacherId: string,
  ) {
    return this.subjectsService.updateSubjectClassTeacher(id, req.user.schoolId, teacherId)
  }

  @Delete('subject-classes/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a subject-class assignment' })
  deleteSubjectClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.subjectsService.deleteSubjectClass(id, req.user.schoolId)
  }

  // ─── Teacher's own subject classes ───────────────────────────────────────────

  @Get('subject-classes/mine')
  @Roles(Role.TEACHER, Role.HOD)
  @ApiOperation({ summary: 'Get subject classes assigned to the current teacher' })
  @ApiQuery({ name: 'academicYearId', required: false })
  getMySubjectClasses(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.subjectsService.findByTeacher(req.user.id, req.user.schoolId, academicYearId)
  }
}
