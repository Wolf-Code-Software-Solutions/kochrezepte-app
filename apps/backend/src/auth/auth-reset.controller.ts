import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthResetService } from './auth-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('api/auth')
export class AuthResetController {
  constructor(private readonly authResetService: AuthResetService) {}

  @Post('request-password-reset')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: RequestPasswordResetDto,
  ): Promise<{ token: string }> {
    return this.authResetService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authResetService.resetPassword(dto.token, dto.newPassword);
    return { success: true };
  }
}
