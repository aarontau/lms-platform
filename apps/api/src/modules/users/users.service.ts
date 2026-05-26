import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { Role } from '../../common/decorators/roles.decorator'

const USER_SELECT = {
  id: true,
  schoolId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: false,
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      })
      if (existing) {
        throw new ConflictException(`A user with email ${dto.email} already exists`)
      }

      if (dto.role !== Role.SUPER_ADMIN && !dto.schoolId) {
        throw new BadRequestException('schoolId is required for non-SUPER_ADMIN users')
      }

      const passwordHash = await bcrypt.hash(dto.password, 10)

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: dto.role as any,
          schoolId: dto.schoolId || null,
        },
        select: {
          id: true,
          schoolId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return user
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error
      }
      throw new ConflictException('Failed to create user. Please check your input and try again.')
    }
  }

  async findAll(schoolId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          schoolId,
          deletedAt: null,
        },
        select: {
          id: true,
          schoolId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      })

      return users
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users')
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          schoolId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`)
      }

      return user
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to retrieve user with ID ${id}`)
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          schoolId: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return user
    } catch (error) {
      return null
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      await this.findOne(id)

      const updateData: any = {}

      if (dto.email !== undefined) {
        const existing = await this.prisma.user.findFirst({
          where: { email: dto.email, id: { not: id } },
        })
        if (existing) {
          throw new ConflictException(`Email ${dto.email} is already in use by another user`)
        }
        updateData.email = dto.email
      }

      if (dto.firstName !== undefined) updateData.firstName = dto.firstName
      if (dto.lastName !== undefined) updateData.lastName = dto.lastName
      if (dto.phone !== undefined) updateData.phone = dto.phone
      if (dto.role !== undefined) updateData.role = dto.role
      if (dto.schoolId !== undefined) updateData.schoolId = dto.schoolId
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          schoolId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return user
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error
      }
      throw new BadRequestException('Failed to update user')
    }
  }

  async deactivate(id: string) {
    try {
      await this.findOne(id)

      const user = await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return user
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to deactivate user with ID ${id}`)
    }
  }

  async changeRole(id: string, role: Role) {
    try {
      await this.findOne(id)

      const user = await this.prisma.user.update({
        where: { id },
        data: { role: role as any },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return user
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException(`Failed to change role for user with ID ${id}`)
    }
  }
}
