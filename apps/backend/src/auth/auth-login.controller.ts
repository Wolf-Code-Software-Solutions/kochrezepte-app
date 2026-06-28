import { Body, Controller, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthLoginService } from './auth-login.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('api/auth')
export class AuthLoginController {
  constructor(private readonly authLoginService: AuthLoginService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  login(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    loginRequest: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authLoginService.login(
      loginRequest.email,
      loginRequest.password,
    );
  }
}
