import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class GenerateTermReportsDto {
  @ApiProperty({ description: 'Term for which to generate draft report cards' })
  @IsUUID('4')
  termId: string

  @ApiProperty({ description: 'Class whose learners will receive report cards' })
  @IsUUID('4')
  classId: string
}
