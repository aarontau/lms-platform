import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { SchoolsModule } from './modules/schools/schools.module'
import { UsersModule } from './modules/users/users.module'
import { GradesModule } from './modules/grades/grades.module'
import { AcademicYearsModule } from './modules/academic-years/academic-years.module'
import { LearnersModule } from './modules/learners/learners.module'
import { SubjectsModule } from './modules/subjects/subjects.module'
import { TimetableModule } from './modules/timetable/timetable.module'
import { AttendanceModule } from './modules/attendance/attendance.module'
import { AssessmentModule } from './modules/assessment/assessment.module'
import { TenantMiddleware } from './common/middleware/tenant.middleware'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    GradesModule,
    AcademicYearsModule,
    LearnersModule,
    SubjectsModule,
    TimetableModule,
    AttendanceModule,
    AssessmentModule,
  ],
  providers: [
    // Every route requires a valid JWT by default.
    // Opt out on individual routes or controllers with @Public().
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'auth/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*')
  }
}
