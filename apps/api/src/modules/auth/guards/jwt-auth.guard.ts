import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator'

/**
 * JwtAuthGuard — full-featured JWT guard registered globally via APP_GUARD.
 *
 * Behaviour:
 *  - Every route is protected by default.
 *  - Routes / controllers decorated with @Public() bypass authentication.
 *  - Provides structured error messages for expired, malformed, and
 *    not-yet-valid tokens.
 *  - Logs every authentication failure for observability.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    return super.canActivate(context)
  }

  /**
   * Called after passport-jwt validates (or rejects) the token.
   *
   * @param err   - Error thrown by JwtStrategy.validate()
   * @param user  - The JwtValidatedUser returned on success
   * @param info  - JsonWebTokenError / TokenExpiredError from the JWT lib
   */
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      const message = this.resolveMessage(err, info)
      this.logger.warn(`JWT authentication failed: ${message}`)
      throw new UnauthorizedException(message)
    }

    return user
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private resolveMessage(err: any, info: any): string {
    if (err instanceof Error) return err.message

    if (info instanceof Error) {
      if (info.name === 'TokenExpiredError') return 'Token has expired'
      if (info.name === 'JsonWebTokenError') return 'Invalid token'
      if (info.name === 'NotBeforeError') return 'Token not yet valid'
      return info.message
    }

    return 'Authentication required'
  }
}
