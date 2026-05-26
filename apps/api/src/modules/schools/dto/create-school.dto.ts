import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator'

// districtId and circuitId are required by the DB schema (non-nullable).
// They are separate foreign keys — a district is not interchangeable with a province.

export enum SchoolType {
  PUBLIC = 'PUBLIC',
  INDEPENDENT = 'INDEPENDENT',
  IEB_SCHOOL = 'IEB_SCHOOL',
  COMBINED = 'COMBINED',
}

export class CreateSchoolDto {
  @ApiProperty({ example: 'Pretoria High School', description: 'Full name of the school' })
  @IsString()
  name: string

  @ApiProperty({ example: '700100001', description: 'EMIS number assigned by the Department of Education' })
  @IsString()
  emisNumber: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Province ID (UUID)',
  })
  @IsUUID('4', { message: 'provinceId must be a valid UUID' })
  provinceId: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'District ID (UUID)',
  })
  @IsUUID('4', { message: 'districtId must be a valid UUID' })
  districtId: string

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Circuit ID (UUID)',
  })
  @IsUUID('4', { message: 'circuitId must be a valid UUID' })
  circuitId: string

  @ApiProperty({
    enum: SchoolType,
    example: SchoolType.PUBLIC,
    description: 'Type of school',
  })
  @IsEnum(SchoolType, { message: `schoolType must be one of: ${Object.values(SchoolType).join(', ')}` })
  schoolType: SchoolType

  @ApiPropertyOptional({ example: '+27121234567', description: 'School phone number' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ example: 'info@pretoriahigh.edu.za', description: 'School email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string

  @ApiPropertyOptional({ example: '123 Church Street, Pretoria, 0001', description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({
    example: 'pretoriahigh',
    description: 'Unique subdomain for the school portal (lowercase, no spaces). Used to identify the tenant.',
  })
  @IsString()
  @MinLength(3, { message: 'Subdomain must be at least 3 characters long' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must be lowercase alphanumeric characters and hyphens only (no spaces)',
  })
  subdomain: string
}
