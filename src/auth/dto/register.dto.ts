import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BotPersonality } from '../../user/enums/bot-personality.enum';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'strong-password' })
  password: string;

  @ApiPropertyOptional({ enum: BotPersonality, example: BotPersonality.GENTLE })
  botPersonality?: BotPersonality;
}
