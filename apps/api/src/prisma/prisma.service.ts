import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * Set the current school context for Row Level Security.
   * Must be called at the start of every request with a school-scoped user.
   */
  async setSchoolContext(schoolId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.current_school_id', $1, true)`,
      schoolId,
    )
  }
}
