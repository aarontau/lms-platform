import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  schoolId: string | null
}

export interface JwtValidatedUser {
  id: string
  email: string
  role: string
  schoolId: string | null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    })
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload')
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
    }
  }
}
