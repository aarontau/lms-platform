import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common'
import {
  HrService,
  CreateRecruitmentDto,
  UpdateRecruitmentDto,
  CreateStaffMemberDto,
  UpdateStaffMemberDto,
} from './hr.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles }       from '../../common/decorators/roles.decorator'
import { Role }        from '../../common/decorators/roles.decorator'

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ── Recruitment ─────────────────────────────────────────────────────────

  @Get('recruitment/stats')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  getRecruitmentStats(@CurrentUser() user: any) {
    return this.hrService.getRecruitmentStats(user.schoolId)
  }

  @Get('recruitment')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  listRecruitments(
    @CurrentUser() user: any,
    @Query('status')         status?: string,
    @Query('postAppliedFor') postAppliedFor?: string,
    @Query('search')         search?: string,
  ) {
    return this.hrService.listRecruitments(user.schoolId, { status, postAppliedFor, search })
  }

  @Get('recruitment/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  getRecruitment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.getRecruitment(id, user.schoolId)
  }

  @Post('recruitment')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  createRecruitment(@CurrentUser() user: any, @Body() dto: CreateRecruitmentDto) {
    return this.hrService.createRecruitment(user.schoolId, dto)
  }

  @Patch('recruitment/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  updateRecruitment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecruitmentDto,
  ) {
    return this.hrService.updateRecruitment(id, user.schoolId, dto)
  }

  @Delete('recruitment/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  deleteRecruitment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deleteRecruitment(id, user.schoolId)
  }

  // ── Staff members ────────────────────────────────────────────────────────

  @Get('staff/stats')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  getStaffStats(@CurrentUser() user: any) {
    return this.hrService.getStaffStats(user.schoolId)
  }

  @Get('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  listStaffMembers(
    @CurrentUser() user: any,
    @Query('isActive')       isActive?: string,
    @Query('employmentType') employmentType?: string,
    @Query('postLevel')      postLevel?: string,
    @Query('search')         search?: string,
  ) {
    return this.hrService.listStaffMembers(user.schoolId, {
      isActive:       isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      employmentType,
      postLevel,
      search,
    })
  }

  @Get('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  getStaffMember(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.getStaffMember(id, user.schoolId)
  }

  @Post('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  createStaffMember(@CurrentUser() user: any, @Body() dto: CreateStaffMemberDto) {
    return this.hrService.createStaffMember(user.schoolId, user.id, dto)
  }

  @Patch('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  updateStaffMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffMemberDto,
  ) {
    return this.hrService.updateStaffMember(id, user.schoolId, dto)
  }

  @Patch('staff/:id/deactivate')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  deactivateStaffMember(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deactivateStaffMember(id, user.schoolId)
  }
}
