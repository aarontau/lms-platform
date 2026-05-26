import {
  IsArray, IsUUID, IsNumber, IsBoolean,
  IsOptional, ValidateNested, Min, ArrayMinSize,
  IsString, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class SingleMarkDto {
  @IsUUID()
  learnerId: string

  /**
   * Raw mark out of AssessmentTask.maxMark.
   * Omit or pass null when the mark has not yet been entered.
   * For absent learners (without exemption), pass isAbsent=true — the
   * calculator will treat this as 0 while still including the task weight.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  rawMark?: number | null

  /** Absent without exemption — counted as 0 in SBA weighting. */
  @IsBoolean()
  isAbsent: boolean

  /** Exempted — task excluded from the weight denominator entirely. */
  @IsBoolean()
  isExempted: boolean

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string
}

export class CaptureMarksDto {
  @IsUUID()
  assessmentTaskId: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SingleMarkDto)
  marks: SingleMarkDto[]
}
