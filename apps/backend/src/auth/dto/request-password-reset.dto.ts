import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Ungültiges E-Mail-Format' })
  email: string;
}
