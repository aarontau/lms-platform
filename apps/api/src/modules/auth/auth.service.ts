import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { AuthResponseDto } from './dto/auth-response.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    try {
      const user = await this.usersService.findByEmail(email)
      if (!user) {
        return null
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated. Please contact your administrator.')
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return null
      }

      return user
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      return null
    }
  }

  async login(user: any): Promise<AuthResponseDto> {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      }

      const accessToken = this.jwtService.sign(payload)

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          schoolId: user.schoolId,
        },
      }
    } catch (error) {
      throw new UnauthorizedException('Failed to generate authentication token')
    }
  }

  async getMe(userId: string) {
    try {
      const user = await this.usersService.findOne(userId)
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`)
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        schoolId: user.schoolId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new UnauthorizedException('Failed to retrieve user profile')
    }
  }
}
