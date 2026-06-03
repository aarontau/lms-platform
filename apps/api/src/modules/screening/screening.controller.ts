import {
  Controller, Get, Post, Patch, Param, Body, Query,
} from '@nestjs/common'
import { ScreeningService, SubmitScreeningDto, ReviewScreeningDto } from './screening.service'
import { CurrentUser }  from '../auth/decorators/current-user.decorator'
import { Roles }        from '../../common/decorators/roles.decorator'
import { Role }         from '../../common/decorators/roles.decorator'

@Controller('screening')
export class ScreeningController {
  constructor(private readonly screeningService: ScreeningService) {}

  // ── Indicator catalogue (used to render the form) ─────────────────────────

  @Get('indicators/:type')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  getIndicators(@Param('type') type: string) {
    return this.screeningService.getIndicators(type as any)
  }

  // ── Submit a new screening ────────────────────────────────────────────────

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  submitScreening(
    @CurrentUser() user: any,
    @Body() dto: SubmitScreeningDto,
  ) {
    return this.screeningService.submitScreening(user.schoolId, user.id, dto)
  }

  // ── List screenings (Principal sees all; Teacher sees own) ───────────────

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  listScreenings(
    @CurrentUser() user: any,
    @Query('learnerId')           learnerId?: string,
    @Query('screenerType')        screenerType?: string,
    @Query('riskLevel')           riskLevel?: string,
    @Query('academicYearId')      academicYearId?: string,
    @Query('reviewedByPrincipal') reviewedByPrincipal?: string,
  ) {
    return this.screeningService.listScreenings(
      user.schoolId, user.id, user.role,
      {
        learnerId,
        screenerType,
        riskLevel,
        academicYearId,
        reviewedByPrincipal: reviewedByPrincipal === 'true'
          ? true
          : reviewedByPrincipal === 'false'
          ? false
          : undefined,
      },
    )
  }

  // ── Principal dashboard summary ───────────────────────────────────────────

  @Get('summary')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  getPrincipalSummary(
    @CurrentUser() user: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.screeningService.getPrincipalSummary(user.schoolId, academicYearId)
  }

  // ── Screenings per learner (for learner detail page) ─────────────────────

  @Get('learner/:learnerId')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  getLearnerScreenings(
    @CurrentUser() user: any,
    @Param('learnerId') learnerId: string,
  ) {
    return this.screeningService.getLearnerScreenings(user.schoolId, learnerId)
  }

  // ── Get single screening record ───────────────────────────────────────────

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.HOD, Role.TEACHER)
  getScreening(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.screeningService.getScreening(id, user.schoolId)
  }

  // ── Principal review ──────────────────────────────────────────────────────

  @Patch(':id/review')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  reviewScreening(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewScreeningDto,
  ) {
    return this.screeningService.reviewScreening(id, user.schoolId, user.id, dto)
  }
}
