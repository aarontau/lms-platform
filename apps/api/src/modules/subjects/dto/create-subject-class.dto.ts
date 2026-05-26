import { IsString, IsNotEmpty, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSubjectClassDto {
  @ApiProperty({ description: 'School subject ID' })
  @IsUUID()
  @IsNotEmpty()
  schoolSubjectId: string

  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  @IsNotEmpty()
  classId: string

  @ApiProperty({ description: 'Teacher (User) ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string

  @ApiProperty({ description: 'Academic year ID' })
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string
}
