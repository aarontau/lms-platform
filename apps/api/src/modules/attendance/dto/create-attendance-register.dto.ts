import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAttendanceRegisterDto {
  @ApiProperty({ description: 'Class ID for this register' })
  @IsUUID()
  @IsNotEmpty()
  classId: string

  @ApiProperty({ description: 'Date of attendance in ISO format', example: '2026-05-26' })
  @IsDateString()
  @IsNotEmpty()
  date: string

  @ApiProperty({ description: 'Academic year ID' })
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string

  @ApiProperty({ description: 'Term ID for this register' })
  @IsUUID()
  @IsNotEmpty()
  termId: string
}
