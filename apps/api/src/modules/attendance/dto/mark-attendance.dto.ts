import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum AttendanceStatusEnum {
  PRESENT        = 'PRESENT',
  ABSENT         = 'ABSENT',
  LATE           = 'LATE',
  EXCUSED_ABSENT = 'EXCUSED_ABSENT',
}

export class AttendanceRecordItemDto {
  @ApiProperty({ description: 'Learner ID' })
  @IsUUID()
  @IsNotEmpty()
  learnerId: string

  @ApiProperty({ enum: AttendanceStatusEnum })
  @IsEnum(AttendanceStatusEnum)
  status: AttendanceStatusEnum

  @ApiPropertyOptional({ description: 'Optional note for absence reason' })
  @IsString()
  @IsOptional()
  notes?: string
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  records: AttendanceRecordItemDto[]
}
