import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
} from '@nestjs/swagger'
import { SchoolsService } from './schools.service'
import { CreateSchoolDto } from './dto/create-school.dto'
import { UpdateSchoolDto } from './dto/update-school.dto'
import { SetupAcademicYearDto } from './dto/setup-academic-year.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Schools')
@ApiBearerAuth()
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new school',
    description: 'Registers a new school tenant in the system. Only accessible by SUPER_ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'School created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'EMIS number or subdomain already in use.' })
  async create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto)
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all schools',
    description: 'Returns all schools registered in the system. Only accessible by SUPER_ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Returns list of all schools.' })
  async findAll() {
    return this.schoolsService.findAll()
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({
    summary: 'Get school by ID',
    description: 'Returns a single school\'s full profile including province, district, circuit and recent academic years.',
  })
  @ApiParam({ name: 'id', description: 'School UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns school profile.' })
  @ApiResponse({ status: 404, description: 'School not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.findOne(id)
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Update school details',
    description: 'Updates school profile fields. All fields are optional. Subdomain and EMIS number uniqueness is enforced.',
  })
  @ApiParam({ name: 'id', description: 'School UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'School updated successfully.' })
  @ApiResponse({ status: 404, description: 'School not found.' })
  @ApiResponse({ status: 409, description: 'Subdomain or EMIS number conflict.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(id, dto)
  }

  @Post(':id/setup-year')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Set up academic year and terms',
    description: 'Creates an AcademicYear record plus 4 standard South African terms with default dates for the given year. Marks the new year as current.',
  })
  @ApiParam({ name: 'id', description: 'School UUID', type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Academic year and 4 terms created successfully.',
  })
  @ApiResponse({ status: 404, description: 'School not found.' })
  @ApiResponse({ status: 409, description: 'Academic year already exists for this school.' })
  async setupAcademicYear(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetupAcademicYearDto,
  ) {
    return this.schoolsService.setupAcademicYear(id, dto.year)
  }
}
