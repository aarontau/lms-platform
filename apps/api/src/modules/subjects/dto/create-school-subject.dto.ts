import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateSchoolSubjectDto {
  @ApiProperty({ description: 'CAPS subject catalogue ID to link to' })
  @IsString()
  @IsNotEmpty()
  capsSubjectId: string

  @ApiProperty({ description: 'Display name for this subject at the school' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Short subject code (e.g. MATH, ENG-HL)' })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiPropertyOptional({ description: 'Whether this subject is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
