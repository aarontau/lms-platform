import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  Request, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Roles, Role } from '../../common/decorators/roles.decorator'
import { LearnersService } from './learners.service'
import { CreateLearnerDto } from './dto/create-learner.dto'
import { UpdateLearnerDto } from './dto/update-learner.dto'
import { CreateGuardianDto } from './dto/create-guardian.dto'
import { LinkGuardianDto } from './dto/link-guardian.dto'
import { LearnerFiltersDto } from './dto/learner-filters.dto'

@ApiTags('Learners')
@ApiBearerAuth()
@Controller('learners')
export class LearnersController {
  constructor(private readonly learnersService: LearnersService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Register a new learner' })
  @ApiResponse({ status: 201, description: 'Learner registered successfully' })
  create(@Request() req: any, @Body() dto: CreateLearnerDto) {
    return this.learnersService.create(req.user.schoolId, dto)
  }

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get paginated list of learners with optional filters' })
  findAll(@Request() req: any, @Query() filters: LearnerFiltersDto) {
    return this.learnersService.findAll(req.user.schoolId, filters)
  }

  @Post('bulk-import')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Bulk import learners from JSON array' })
  @ApiResponse({ status: 201, description: 'Returns success/failed counts with error details' })
  bulkImport(
    @Request() req: any,
    @Body() dto: { learners: CreateLearnerDto[] },
  ) {
    return this.learnersService.bulkImport(req.user.schoolId, dto.learners)
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get full learner profile including guardians and enrolment history' })
  findOne(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.learnersService.findOne(req.user.schoolId, id)
  }

  @Put(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Update learner biographical or status details' })
  update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearnerDto,
  ) {
    return this.learnersService.update(req.user.schoolId, id, dto)
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a learner (sets status to INACTIVE)' })
  deactivate(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.learnersService.deactivate(req.user.schoolId, id)
  }

  @Post(':id/guardians')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Create a new guardian and link to learner' })
  createGuardian(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) learnerId: string,
    @Body() dto: CreateGuardianDto,
  ) {
    return this.learnersService.createGuardian(req.user.schoolId, learnerId, dto)
  }

  @Post(':id/guardians/link')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Link an existing guardian to a learner' })
  linkGuardian(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) learnerId: string,
    @Body() dto: LinkGuardianDto,
  ) {
    return this.learnersService.linkGuardian(req.user.schoolId, learnerId, dto)
  }

  @Get(':id/guardians')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: "Get all guardians linked to a learner" })
  getGuardians(@Request() req: any, @Param('id', ParseUUIDPipe) learnerId: string) {
    return this.learnersService.getGuardians(req.user.schoolId, learnerId)
  }
}
