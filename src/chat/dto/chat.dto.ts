import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'Nhận xét tuần này giúp mình' })
  message: string;

  @ApiProperty({ example: true })
  include_context: boolean;
}
