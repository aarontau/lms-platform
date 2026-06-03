import { Module }           from '@nestjs/common'
import { ScreeningService }    from './screening.service'
import { ScreeningController } from './screening.controller'
import { PrismaModule }        from '../../prisma/prisma.module'

@Module({
  imports:     [PrismaModule],
  controllers: [ScreeningController],
  providers:   [ScreeningService],
  exports:     [ScreeningService],
})
export class ScreeningModule {}
