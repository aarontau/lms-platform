import { IsUUID, IsBoolean, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class LinkGuardianDto {
  @ApiProperty() @IsUUID() guardianId: string
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrimary?: boolean
}
