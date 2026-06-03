import { Module }                from '@nestjs/common'
import { AttendanceService }     from './attendance.service'
import { AttendanceController }  from './attendance.controller'
import { PrismaModule }          from '../../prisma/prisma.module'
import { NotificationsModule }   from '../notifications/notifications.module'

@Module({
  imports:     [PrismaModule, NotificationsModule],
  providers:   [AttendanceService],
  controllers: [AttendanceController],
  exports:     [AttendanceService],
})
export class AttendanceModule {}
