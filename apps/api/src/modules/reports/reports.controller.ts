/**
 * Reports Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Route map:
 *
 *   POST   /reports/term/generate              Generate DRAFT report cards
 *   GET    /reports/term                       List report cards (with filters)
 *   GET    /reports/term/:id                   Get one full report card
 *   PATCH  /reports/term/:id/publish           Publish a report card
 *
 *   POST   /reports/annual/calculate           Calculate annual subject results
 *
 *   GET    /reports/promotion                  List promotion decisions
 *   POST   /reports/promotion                  Record a promotion decision
 *
 *   GET    /reports/at-risk                    School-wide at-risk overview
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Controller, Get, Post, Patch,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { ReportsService }               from './reports.service'
import { GenerateTermReportsDto }       from './dto/generate-term-report.dto'
import { CalculateAnnualResultsDto }    from './dto/calculate-annual.dto'
import { RecordPromotionDecisionDto }   from './dto/promotion-decision.dto'
import { Roles }                        from '../../common/decorators/roles.decorator'
import { Role }                         from '../../common/decorators/roles.decorator'
import { CurrentUser }                  from '../auth/decorators/current-user.decorator'

@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  // ─── Term Reports ──────────────────────────────────────────────────────────

  @Post('term/generate')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  generateTermReports(
    @CurrentUser() user: any,
    @Body() dto: GenerateTermReportsDto,
  ) {
    return this.svc.generateTermReports(user.schoolId, user.id, dto)
  }

  @Get('term')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  listReportCards(
    @CurrentUser() user: any,
    @Query('termId')          termId?:          string,
    @Query('classId')         classId?:         string,
    @Query('academicYearId')  academicYearId?:  string,
    @Query('status')          status?:          string,
  ) {
    return this.svc.listReportCards(user.schoolId, { termId, classId, academicYearId, status })
  }

  @Get('term/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  getReportCard(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.getReportCard(id, user.schoolId)
  }

  @Patch('term/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  publishReport(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.publishReport(id, user.schoolId, user.id)
  }

  // ─── Annual Results ────────────────────────────────────────────────────────

  @Post('annual/calculate')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  calculateAnnualResults(
    @CurrentUser() user: any,
    @Body() dto: CalculateAnnualResultsDto,
  ) {
    return this.svc.calculateAnnualResults(user.schoolId, dto)
  }

  // ─── Promotion Decisions ───────────────────────────────────────────────────

  @Get('promotion')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  listPromotionDecisions(
    @CurrentUser() user: any,
    @Query('academicYearId') academicYearId: string,
    @Query('classId')        classId?:       string,
  ) {
    return this.svc.listPromotionDecisions(user.schoolId, academicYearId, classId)
  }

  @Post('promotion')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  recordPromotionDecision(
    @CurrentUser() user: any,
    @Body() dto: RecordPromotionDecisionDto,
  ) {
    return this.svc.recordPromotionDecision(user.schoolId, user.id, dto)
  }

  // ─── At-Risk Overview ──────────────────────────────────────────────────────

  @Get('at-risk')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  getAtRiskSummary(
    @CurrentUser() user: any,
    @Query('termId') termId?: string,
  ) {
    return this.svc.getAtRiskSummary(user.schoolId, termId)
  }
}
