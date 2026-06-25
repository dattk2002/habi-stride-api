import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Send a registration OTP to an email address' })
  @Post('verification-email/request')
  requestEmailVerification(@Body() dto: RequestEmailOtpDto) { return this.authService.requestEmailVerification(dto); }

  @ApiOperation({ summary: 'Verify the registration OTP' })
  @Post('verification-email/verify')
  verifyEmail(@Body() dto: VerifyEmailOtpDto) { return this.authService.verifyEmail(dto); }

  @ApiOperation({ summary: 'Register with a verified email' })
  @Post('register')
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @ApiOperation({ summary: 'Login with email and password' })
  @Post('login')
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @ApiOperation({ summary: 'Login or register with a Google ID token' })
  @Post('google')
  googleLogin(@Body() dto: GoogleAuthDto) { return this.authService.googleLogin(dto); }
}
