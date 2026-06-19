import { ApiProperty } from '@nestjs/swagger';

export class UseItemDto {
  @ApiProperty({ example: 'fertilizer' })
  item: string;
}
