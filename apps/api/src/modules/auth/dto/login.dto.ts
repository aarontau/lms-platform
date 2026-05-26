import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'admin@school.edu.za', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({ example: 'SecurePass123', description: 'User password (minimum 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string
}
