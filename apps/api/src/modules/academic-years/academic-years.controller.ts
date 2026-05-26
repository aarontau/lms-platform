import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { AcademicYearsService } from './academic-years.service'
import { CreateAcademicYearDto } from './dto/create-academic-year.dto'
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto'
import { Roles, Role } from '../../common/decorators/roles.decorator'

@ApiTags('Academic Years')
@ApiBearerAuth()
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an academic year',
    description: 'Creates an academic year for the authenticated user\'s school.',
  })
  @ApiResponse({ status: 201, description: 'Academic year created successfully.' })
  @ApiResponse({ status: 409, description: 'Academic year already exists for this school.' })
  async create(@Request() req: any, @Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(req.user.schoolId, dto)
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({
    summary: 'List academic years for the school',
    description: 'Returns all academic years for the authenticated user\'s school, with their terms.',
  })
  @ApiResponse({ status: 200, description: 'Returns list of academic years.' })
  async findAll(@Request() req: any) {
    return this.academicYearsService.findAll(req.user.schoolId)
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Get academic year by ID', description: 'Returns a single academic year with terms and grades.' })
  @ApiParam({ name: 'id', description: 'Academic Year UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns academic year detail.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.academicYearsService.findOne(id, req.user.schoolId)
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'Update an academic year', description: 'Updates academic year fields.' })
  @ApiParam({ name: 'id', description: 'Academic Year UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Academic year updated successfully.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearsService.update(id, req.user.schoolId, dto)
  }

  @Patch(':id/set-current')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({
    summary: 'Set as current academic year',
    description: 'Marks this academic year as current and unsets the current flag on all others.',
  })
  @ApiParam({ name: 'id', description: 'Academic Year UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Academic year set as current.' })
  @ApiResponse({ status: 404, description: 'Academic year not found.' })
  async setCurrent(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.academicYearsService.setCurrent(id, req.user.schoolId)
  }
}
