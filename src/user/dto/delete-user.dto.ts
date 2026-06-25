import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Re-enter the account email to confirm deletion.' })
  @IsEmail()
  email: string;
}
