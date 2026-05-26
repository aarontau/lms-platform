import { Module } from '@nestjs/common'
import { LearnersController } from './learners.controller'
import { LearnersService } from './learners.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [LearnersController],
  providers: [LearnersService],
  exports: [LearnersService],
})
export class LearnersModule {}
