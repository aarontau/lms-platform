/**
 * Analytics Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /analytics/overview              School overview (principal dashboard)
 * GET /analytics/enrolment             Enrolment by grade
 * GET /analytics/attendance            Attendance summary + 7-day rolling
 * GET /analytics/subjects              Subject performance + pass rates
 * GET /analytics/at-risk               At-risk learner list
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Controller, Get, Query, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { Roles, Role } from '../../common/decorators/roles.decorator'
import { AnalyticsService } from './analytics.service'

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiOperation({ summary: 'School-wide overview metrics' })
  getOverview(@Request() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.analyticsService.getOverview(req.user.schoolId, academicYearId)
  }

  @Get('enrolment')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiOperation({ summary: 'Enrolment breakdown by grade' })
  getEnrolment(
    @Request() req: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.analyticsService.getEnrolmentByGrade(
      req.user.schoolId,
      academicYearId,
    )
  }

  @Get('attendance')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  @ApiOperation({ summary: 'Attendance summary and 7-day rolling rate' })
  getAttendance(@Request() req: any, @Query('termId') termId?: string) {
    return this.analyticsService.getAttendanceSummary(req.user.schoolId, termId)
  }

  @Get('subjects')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiOperation({ summary: 'Subject performance pass rates' })
  getSubjectPerformance(@Request() req: any, @Query('termId') termId?: string) {
    return this.analyticsService.getSubjectPerformance(req.user.schoolId, termId)
  }

  @Get('at-risk')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD)
  @ApiOperation({ summary: 'At-risk learners ranked by subject count' })
  getAtRisk(
    @Request() req: any,
    @Query('termId') termId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getAtRiskLearners(
      req.user.schoolId,
      termId,
      limit ? parseInt(limit) : 20,
    )
  }
}
