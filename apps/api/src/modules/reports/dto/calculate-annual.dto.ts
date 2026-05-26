import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class CalculateAnnualResultsDto {
  @ApiProperty({ description: 'Academic year for which to calculate annual results' })
  @IsUUID('4')
  academicYearId: string

  @ApiProperty({ description: 'Class whose learners will have annual results calculated' })
  @IsUUID('4')
  classId: string
}
