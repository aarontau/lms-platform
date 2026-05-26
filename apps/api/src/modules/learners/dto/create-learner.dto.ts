import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsDateString, IsUUID, MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export enum Gender {
  MALE   = 'MALE',
  FEMALE = 'FEMALE',
  OTHER  = 'OTHER',
}

export enum IdType {
  SA_ID             = 'SA_ID',
  PASSPORT          = 'PASSPORT',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
}

export class CreateLearnerDto {
  @ApiProperty() @IsString() @MinLength(1) firstName: string
  @ApiPropertyOptional() @IsOptional() @IsString() middleName?: string
  @ApiProperty() @IsString() @MinLength(1) lastName: string
  @ApiProperty() @IsDateString() dateOfBirth: string
  @ApiProperty({ enum: Gender }) @IsEnum(Gender) gender: Gender
  @ApiPropertyOptional({ default: 'South African' }) @IsOptional() @IsString() nationality?: string
  @ApiProperty() @IsString() homeLanguage: string
  @ApiPropertyOptional() @IsOptional() @IsString() idNumber?: string
  @ApiPropertyOptional({ enum: IdType }) @IsOptional() @IsEnum(IdType) idType?: IdType
  @ApiProperty() @IsDateString() admissionDate: string
  @ApiPropertyOptional() @IsOptional() @IsString() admissionNumber?: string
  @ApiPropertyOptional() @IsOptional() @IsString() previousSchool?: string
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasSpecialNeeds?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() medicalNotes?: string
  @ApiProperty() @IsUUID() gradeId: string
  @ApiProperty() @IsUUID() classId: string
}
