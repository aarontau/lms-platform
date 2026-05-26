import { IsString, IsOptional, IsEnum, IsBoolean, IsEmail, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export enum Relationship {
  MOTHER      = 'MOTHER',
  FATHER      = 'FATHER',
  GUARDIAN    = 'GUARDIAN',
  GRANDPARENT = 'GRANDPARENT',
  SIBLING     = 'SIBLING',
  OTHER       = 'OTHER',
}

export class CreateGuardianDto {
  @ApiProperty() @IsString() @MinLength(1) firstName: string
  @ApiProperty() @IsString() @MinLength(1) lastName: string
  @ApiPropertyOptional() @IsOptional() @IsString() idNumber?: string
  @ApiProperty() @IsString() phonePrimary: string
  @ApiPropertyOptional() @IsOptional() @IsString() phoneSecondary?: string
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string
  @ApiProperty({ enum: Relationship }) @IsEnum(Relationship) relationship: Relationship
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrimaryContact?: boolean
  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  canCollect?: boolean
}
