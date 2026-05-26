import { SetMetadata } from '@nestjs/common'

/**
 * Marks a route or controller as publicly accessible.
 * When JwtAuthGuard is registered as a global APP_GUARD, any route
 * decorated with @Public() bypasses JWT authentication entirely.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
