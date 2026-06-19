import { ApiProperty } from '@nestjs/swagger';
import { BotPersonality } from '../../user/enums/bot-personality.enum';

export class UpdateBotPersonalityDto {
  @ApiProperty({ enum: BotPersonality, example: BotPersonality.GENTLE })
  botPersonality: BotPersonality;
}
