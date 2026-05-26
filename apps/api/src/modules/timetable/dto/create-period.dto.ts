import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePeriodDto {
  @ApiProperty({ description: 'Academic year this period belongs to' })
  @IsString()
  @IsNotEmpty()
  academicYearId: string

  @ApiProperty({ description: 'Period label, e.g. "Period 1" or "Break"' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Period sequence number within the day', example: 1 })
  @IsNumber()
  @Min(1)
  @Max(20)
  periodNumber: number

  @ApiProperty({ description: 'Start time in HH:MM format', example: '08:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM format' })
  startTime: string

  @ApiProperty({ description: 'End time in HH:MM format', example: '08:45' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:MM format' })
  endTime: string

  @ApiProperty({ description: 'Day of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri', minimum: 1, maximum: 7 })
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number

  @ApiPropertyOptional({ description: 'Is this a teaching period (vs break/lunch)?', default: true })
  @IsBoolean()
  @IsOptional()
  isLesson?: boolean
}
