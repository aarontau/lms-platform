import { Module } from '@nestjs/common'
import { LuritsController } from './lurits.controller'
import { LuritsService } from './lurits.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [LuritsController],
  providers: [LuritsService],
  exports: [LuritsService],
})
export class LuritsModule {}
