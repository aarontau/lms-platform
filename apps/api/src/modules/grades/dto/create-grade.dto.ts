import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator'

export class CreateGradeDto {
  @ApiProperty({ example: 10, description: 'Grade number (1–12)', minimum: 1, maximum: 12 })
  @IsInt({ message: 'gradeNumber must be an integer' })
  @Min(1, { message: 'gradeNumber must be at least 1' })
  @Max(12, { message: 'gradeNumber must be at most 12' })
  gradeNumber: number

  @ApiProperty({ example: 'Grade 10', description: 'Display name for the grade' })
  @IsString()
  name: string

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'CAPS Phase ID (UUID)' })
  @IsUUID('4', { message: 'capsPhaseId must be a valid UUID' })
  capsPhaseId: string

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Academic Year ID (UUID)' })
  @IsUUID('4', { message: 'academicYearId must be a valid UUID' })
  academicYearId: string
}
