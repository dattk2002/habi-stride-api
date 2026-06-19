import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserDto {
  @ApiProperty({ example: 'I no longer want to use this account.' })
  reason: string;
}
