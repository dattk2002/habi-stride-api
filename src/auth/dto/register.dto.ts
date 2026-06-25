import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strong-password-1' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'password must contain at least one letter and one number' })
  password: string;

  @ApiProperty({ description: 'Short-lived token returned after OTP verification' })
  @IsJWT()
  verificationToken: string;
}
