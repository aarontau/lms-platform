import {
  IsUUID, IsInt, Min, Max, IsOptional, IsEnum,
} from 'class-validator'

export enum PoaStatus {
  DRAFT     = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED  = 'APPROVED',
}

export class CreatePoaDto {
  @IsUUID()
  subjectClassId: string

  @IsUUID()
  termId: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  totalTasksRequired?: number   // advisory target — defaults to 0

  @IsOptional()
  @IsEnum(PoaStatus)
  status?: PoaStatus
}
