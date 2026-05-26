import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator'
import { Role } from '../../../common/decorators/roles.decorator'

export class CreateUserDto {
  @ApiProperty({ example: 'teacher@school.edu.za', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({ example: 'SecurePass123', description: 'Password (minimum 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string

  @ApiProperty({ example: 'Thabo', description: 'User first name' })
  @IsString()
  firstName: string

  @ApiProperty({ example: 'Nkosi', description: 'User last name' })
  @IsString()
  lastName: string

  @ApiPropertyOptional({ example: '+27821234567', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ enum: Role, example: Role.TEACHER, description: 'User role in the system' })
  @IsEnum(Role, { message: `Role must be one of: ${Object.values(Role).join(', ')}` })
  role: Role

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'School ID (UUID). Required for all roles except SUPER_ADMIN.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'schoolId must be a valid UUID' })
  schoolId?: string
}
