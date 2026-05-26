import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsInt, IsOptional, Max, Min } from 'class-validator'

export class CreateAcademicYearDto {
  @ApiProperty({ example: 2025, description: 'Academic year (2024–2035)', minimum: 2024, maximum: 2035 })
  @IsInt()
  @Min(2024)
  @Max(2035)
  year: number

  @ApiPropertyOptional({ example: true, description: 'Set as current active year' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean

  @ApiProperty({ example: '2025-01-15', description: 'Year start date' })
  @Type(() => Date)
  @IsDate()
  startDate: Date

  @ApiProperty({ example: '2025-12-05', description: 'Year end date' })
  @Type(() => Date)
  @IsDate()
  endDate: Date
}
