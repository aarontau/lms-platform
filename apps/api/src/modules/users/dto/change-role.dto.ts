import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { Role } from '../../../common/decorators/roles.decorator'

export class ChangeRoleDto {
  @ApiProperty({ enum: Role, description: 'New role to assign to the user' })
  @IsEnum(Role, { message: `Role must be one of: ${Object.values(Role).join(', ')}` })
  role: Role
}
