/**
 * Portal Controller — read-only parent-facing API
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes require role=PARENT. The service enforces that the parent owns
 * a guardian link to the requested learner before returning any data.
 *
 * Route map:
 *   GET /portal/children                          My linked learners
 *   GET /portal/children/:id/summary              Child dashboard card
 *   GET /portal/children/:id/marks                SBA results by subject
 *   GET /portal/children/:id/attendance           Attendance summary + absences
 *   GET /portal/children/:id/assessments          Upcoming assessment tasks
 *   GET /portal/children/:id/reports              Published report cards
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Controller, Get, Param,
} from '@nestjs/common'
import { PortalService }  from './portal.service'
import { Roles }          from '../../common/decorators/roles.decorator'
import { Role }           from '../../common/decorators/roles.decorator'
import { CurrentUser }    from '../auth/decorators/current-user.decorator'

@Controller('portal')
@Roles(Role.PARENT)
export class PortalController {
  constructor(private readonly svc: PortalService) {}

  @Get('children')
  getMyChildren(@CurrentUser() user: any) {
    return this.svc.getMyChildren(user.id, user.schoolId)
  }

  @Get('children/:id/summary')
  getChildSummary(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.svc.getChildSummary(user.id, user.schoolId, id)
  }

  @Get('children/:id/marks')
  getChildMarks(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.svc.getChildMarks(user.id, user.schoolId, id)
  }

  @Get('children/:id/attendance')
  getChildAttendance(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.svc.getChildAttendance(user.id, user.schoolId, id)
  }

  @Get('children/:id/assessments')
  getChildUpcomingAssessments(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.svc.getChildUpcomingAssessments(user.id, user.schoolId, id)
  }

  @Get('children/:id/reports')
  getChildReports(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.svc.getChildReports(user.id, user.schoolId, id)
  }
}
