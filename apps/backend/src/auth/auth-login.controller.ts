import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthLoginService } from './auth-login.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('api/auth')
export class AuthLoginController {
  constructor(private readonly authLoginService: AuthLoginService) {}

  @Post('login')
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
