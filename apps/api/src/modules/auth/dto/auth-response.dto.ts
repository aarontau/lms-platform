import { ApiProperty } from '@nestjs/swagger'

export class AuthUserDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  role: string

  @ApiProperty({ nullable: true })
  schoolId: string | null
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string

  @ApiProperty({ type: AuthUserDto })
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    schoolId: string | null
  }
}
