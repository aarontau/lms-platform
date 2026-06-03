import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { LearnerStatus } from './update-learner.dto'

export class LearnerFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gradeId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() classId?: string
  @ApiPropertyOptional({ enum: LearnerStatus }) @IsOptional() @IsEnum(LearnerStatus) status?: LearnerStatus
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20
}
