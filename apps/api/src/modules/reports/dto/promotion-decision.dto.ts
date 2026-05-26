import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsEnum, IsBoolean, IsString, IsOptional } from 'class-validator'

export enum PromotionRecommendation {
  PROMOTE  = 'PROMOTE',
  REPEAT   = 'REPEAT',
  PROGRESS = 'PROGRESS',
}

export class RecordPromotionDecisionDto {
  @ApiProperty({ description: 'Learner ID' })
  @IsUUID('4')
  learnerId: string

  @ApiProperty({ description: 'Academic year ID' })
  @IsUUID('4')
  academicYearId: string

  @ApiProperty({
    enum: PromotionRecommendation,
    description: 'Final promotion decision',
  })
  @IsEnum(PromotionRecommendation)
  finalDecision: PromotionRecommendation

  @ApiPropertyOptional({ description: 'Set true when overriding the auto-calculated recommendation' })
  @IsOptional()
  @IsBoolean()
  isOverridden?: boolean

  @ApiPropertyOptional({ description: 'Required when isOverridden is true' })
  @IsOptional()
  @IsString()
  overrideReason?: string
}
