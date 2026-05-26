import {
  IsString, IsUUID, IsNumber, IsBoolean,
  Min, Max, MaxLength, IsOptional, IsDateString, IsEnum,
} from 'class-validator'

/**
 * Maps to the Prisma TaskType enum.
 * These values are fixed by the schema — do not add variants here
 * without a corresponding migration.
 */
export enum TaskType {
  DIAGNOSTIC    = 'DIAGNOSTIC',
  CLASS_TEST    = 'CLASS_TEST',
  ASSIGNMENT    = 'ASSIGNMENT',
  HOMEWORK      = 'HOMEWORK',
  ORAL          = 'ORAL',
  PRACTICAL     = 'PRACTICAL',
  SUMMATIVE_EXAM = 'SUMMATIVE_EXAM',
}

export class CreateTaskDto {
  @IsUUID()
  programmeOfAssessmentId: string

  @IsString()
  @MaxLength(150)
  title: string

  @IsEnum(TaskType)
  taskType: TaskType

  @IsNumber()
  @Min(1)
  @Max(400)
  maxMark: number

  /**
   * This task's weight within the SBA (0–100).
   * All tasks in a POA must sum to exactly 100.
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  weightInSba: number

  /**
   * True only for formal end-of-year / mid-year examination tasks.
   * Exam tasks are excluded from term SBA calculation.
   */
  @IsBoolean()
  isExam: boolean

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string

  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(400)
  maxMark?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightInSba?: number

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string
}
