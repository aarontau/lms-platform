import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LocalGuard } from './guards/local.guard'
import { Public } from '../../common/decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { AuthResponseDto } from './dto/auth-response.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate with email and password. Returns a JWT access token and user profile.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access token and user profile.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account deactivated.' })
  async login(@Request() req: any): Promise<AuthResponseDto> {
    return this.authService.login(req.user)
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile. Requires a valid JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current user profile without password hash.',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token.' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id)
  }
}
