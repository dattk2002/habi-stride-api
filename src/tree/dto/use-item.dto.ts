import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UseItemDto {
  @ApiProperty({ example: 'fertilizer' })
  @IsString()
  @IsIn(['fertilizer', 'magic_water', 'decorative_pot'])
  item: string;
}
