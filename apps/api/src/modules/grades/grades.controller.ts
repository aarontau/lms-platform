import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { GradesService } from './grades.service'
import { CreateGradeDto } from './dto/create-grade.dto'
import { UpdateGradeDto } from './dto/update-grade.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Grades')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a grade',
    description: 'Creates a new grade for the authenticated user\'s school.',
  })
  @ApiResponse({ status: 201, description: 'Grade created successfully.' })
  @ApiResponse({ status: 409, description: 'Grade already exists for this academic year.' })
  async create(@Request() req: any, @Body() dto: CreateGradeDto) {
    const schoolId = req.user.schoolId
    return this.gradesService.create(schoolId, dto)
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({
    summary: 'List grades for the school',
    description: 'Returns all grades for the authenticated user\'s school. Optionally filter by academic year.',
  })
  @ApiQuery({ name: 'academicYearId', required: false, description: 'Filter by academic year UUID' })
  @ApiResponse({ status: 200, description: 'Returns list of grades.' })
  async findAll(@Request() req: any, @Query('academicYearId') academicYearId?: string) {
    const schoolId = req.user.schoolId
    return this.gradesService.findAll(schoolId, academicYearId)
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get grade by ID', description: 'Returns a single grade with its classes.' })
  @ApiParam({ name: 'id', description: 'Grade UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns grade detail.' })
  @ApiResponse({ status: 404, description: 'Grade not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const schoolId = req.user.schoolId
    return this.gradesService.findOne(id, schoolId)
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Update a grade', description: 'Updates grade fields. All fields are optional.' })
  @ApiParam({ name: 'id', description: 'Grade UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Grade updated successfully.' })
  @ApiResponse({ status: 404, description: 'Grade not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: UpdateGradeDto,
  ) {
    const schoolId = req.user.schoolId
    return this.gradesService.update(id, schoolId, dto)
  }
}
