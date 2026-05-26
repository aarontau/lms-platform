import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Tenant Middleware
 * Extracts school_id from the authenticated JWT and sets PostgreSQL RLS context.
 * Must run on every request for tenant-scoped routes.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user
    if (user?.schoolId) {
      await this.prisma.setSchoolContext(user.schoolId)
    }
    next()
  }
}
