import { PartialType } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { CreateLearnerDto } from './create-learner.dto'

export enum LearnerStatus {
  ACTIVE          = 'ACTIVE',
  INACTIVE        = 'INACTIVE',
  TRANSFERRED_OUT = 'TRANSFERRED_OUT',
  GRADUATED       = 'GRADUATED',
  SUSPENDED       = 'SUSPENDED',
}

export class UpdateLearnerDto extends PartialType(CreateLearnerDto) {
  @ApiPropertyOptional({ enum: LearnerStatus })
  @IsOptional() @IsEnum(LearnerStatus)
  status?: LearnerStatus
}
