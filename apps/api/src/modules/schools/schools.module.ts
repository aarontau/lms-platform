import { Module } from '@nestjs/common'
import { SchoolsService } from './schools.service'
import { SchoolsController } from './schools.controller'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [SchoolsService],
  controllers: [SchoolsController],
  exports: [SchoolsService],
})
export class SchoolsModule {}
