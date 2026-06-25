import { Body, Controller, Get, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { concatMap, delay, from, map, of } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'Send a chat message' })
  @Post()
  chat(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChatDto) {
    return this.chatService.chat(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get 50 latest chat messages' })
  @Get('history')
  getHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getHistory(user.sub);
  }

  @ApiOperation({ summary: 'Stream a chat response over SSE' })
  @ApiQuery({ name: 'message', example: 'Motivate me today' })
  @ApiQuery({ name: 'include_context', required: false, example: 'true' })
  @Sse('stream')
  async stream(
    @CurrentUser() user: CurrentUserPayload,
    @Query('message') message: string,
    @Query('include_context') includeContext?: string,
  ) {
    const result = await this.chatService.createAssistantMessage(user.sub, {
      message,
      include_context: includeContext === 'true',
    });
    const chunks = result.message.content.match(/.{1,24}(\s|$)/g) || [result.message.content];

    return from(chunks).pipe(
      concatMap((chunk) => of(chunk.trim()).pipe(delay(40))),
      map((chunk) => ({ data: { chunk, messageId: result.message.id, provider: result.provider } })),
    );
  }
}
