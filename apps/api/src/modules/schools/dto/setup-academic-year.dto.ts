import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Max, Min } from 'class-validator'

export class SetupAcademicYearDto {
  @ApiProperty({
    example: 2025,
    description: 'Academic year to set up (2024–2035). Creates the year and 4 standard SA terms.',
    minimum: 2024,
    maximum: 2035,
  })
  @IsNumber({}, { message: 'year must be a number' })
  @Min(2024, { message: 'year must be 2024 or later' })
  @Max(2035, { message: 'year must be 2035 or earlier' })
  year: number
}
