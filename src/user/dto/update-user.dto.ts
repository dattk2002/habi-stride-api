import { ApiPropertyOptional } from '@nestjs/swagger';
import { BotPersonality } from '../enums/bot-personality.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'new-strong-password' })
  password?: string;

  @ApiPropertyOptional({ enum: BotPersonality, example: BotPersonality.GENTLE })
  botPersonality?: BotPersonality;
}
