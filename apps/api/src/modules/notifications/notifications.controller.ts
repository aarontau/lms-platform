import {
  Controller, Get, Post, Patch, Param, Query, Body, Request, UseGuards,
} from '@nestjs/common'
import { IsString, IsArray, IsOptional, IsIn } from 'class-validator'
import { JwtAuthGuard }           from '../auth/guards/jwt-auth.guard'
import { NotificationsService }   from './notifications.service'
import { Roles, Role }            from '../../common/decorators/roles.decorator'

class BroadcastDto {
  @IsString() title:  string
  @IsString() body:   string
  @IsArray()  @IsString({ each: true }) roles: string[]
  @IsOptional() @IsIn(['ABSENCE_ALERT','REPORT_CARD_READY','MARK_PUBLISHED','INVOICE_ISSUED','GENERAL','SYSTEM'])
  type?: string
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — list my notifications */
  @Get()
  async getMyNotifications(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const onlyUnread = unreadOnly === 'true' || unreadOnly === '1'
    return this.notificationsService.getMyNotifications(
      req.user.id,
      req.user.schoolId,
      onlyUnread,
    )
  }

  /** GET /notifications/unread-count */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.id,
      req.user.schoolId,
    )
    return { count }
  }

  /** PATCH /notifications/:id/read — mark single notification as read */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id, req.user.schoolId)
  }

  /** PATCH /notifications/read-all — mark all as read */
  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id, req.user.schoolId)
  }

  /** POST /notifications/broadcast — send to all users of given roles */
  @Post('broadcast')
  @Roles(Role.SCHOOL_ADMIN, Role.PRINCIPAL)
  async broadcast(@Request() req: any, @Body() dto: BroadcastDto) {
    return this.notificationsService.broadcastToRole({
      schoolId: req.user.schoolId,
      roles:    dto.roles,
      title:    dto.title,
      body:     dto.body,
      type:     dto.type as any,
    })
  }
}
