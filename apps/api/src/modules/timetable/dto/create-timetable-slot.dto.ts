import { IsString, IsNotEmpty, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateTimetableSlotDto {
  @ApiProperty({ description: 'Period ID for this slot' })
  @IsUUID()
  @IsNotEmpty()
  periodId: string

  @ApiProperty({ description: 'Subject class assigned to this slot' })
  @IsUUID()
  @IsNotEmpty()
  subjectClassId: string

  @ApiProperty({ description: 'Venue (room) for this slot' })
  @IsUUID()
  @IsNotEmpty()
  venueId: string

  @ApiProperty({ description: 'Academic year for this slot' })
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string
}
