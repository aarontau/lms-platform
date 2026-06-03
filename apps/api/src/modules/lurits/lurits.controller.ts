/**
 * LURITS / SA-SAMS Export Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /lurits/history                    List all export batches
 * POST /lurits/validate                   Validate data before export
 * POST /lurits/export                     Generate and download export
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Controller, Get, Post, Body, Request, Res, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsIn } from 'class-validator'
import { Response } from 'express'
import { Roles, Role } from '../../common/decorators/roles.decorator'
import { LuritsService } from './lurits.service'

const EXPORT_TYPES = ['LEARNER_DATA', 'ATTENDANCE', 'MARKS', 'EMIS_ANNUAL'] as const
type ExportType = typeof EXPORT_TYPES[number]

class ValidateExportDto {
  @IsString()
  academicYearId: string

  @IsString()
  @IsIn(EXPORT_TYPES)
  exportType: ExportType
}

class GenerateExportDto {
  @IsString()
  academicYearId: string

  @IsString()
  @IsIn(EXPORT_TYPES)
  exportType: ExportType
}

@ApiTags('LURITS / SA-SAMS Export')
@ApiBearerAuth()
@Controller('lurits')
export class LuritsController {
  constructor(private readonly luritsService: LuritsService) {}

  @Get('history')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @ApiOperation({ summary: 'List LURITS export history' })
  listBatches(@Request() req: any) {
    return this.luritsService.listBatches(req.user.schoolId)
  }

  @Post('validate')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate data readiness for LURITS export' })
  validate(@Request() req: any, @Body() dto: ValidateExportDto) {
    return this.luritsService.validate(
      req.user.schoolId,
      dto.academicYearId,
      dto.exportType,
    )
  }

  @Post('export')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate LURITS/SA-SAMS export CSV' })
  async export(
    @Request() req: any,
    @Body() dto: GenerateExportDto,
    @Res() res: Response,
  ) {
    const result = await this.luritsService.generateExport(
      req.user.schoolId,
      dto.academicYearId,
      dto.exportType,
      req.user.id,
    )

    // Return CSV as downloadable file
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('X-Record-Count', result.recordCount.toString())
    res.setHeader('X-Batch-Id', result.batch.id)
    res.send(result.csvContent)
  }
}
