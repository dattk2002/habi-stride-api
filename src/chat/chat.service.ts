import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatDto } from './dto/chat.dto';
import { ChatMessage } from './entity/chat-message.entity';
import { UserSetting } from '../user/entity/user-setting.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
  ) {}

  async chat(userId: string, dto: ChatDto) {
    const assistantMessage = await this.createAssistantMessage(userId, dto);

    return {
      message: assistantMessage,
      provider: 'local-stub',
      streaming: false,
    };
  }

  getHistory(userId: string) {
    return this.chatMessageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createAssistantMessage(userId: string, dto: ChatDto) {
    await this.chatMessageRepository.save(
      this.chatMessageRepository.create({
        userId,
        role: 'user',
        content: dto.message,
      }),
    );

    const setting = await this.userSettingRepository.findOne({ where: { userId } });
    const personality = setting?.botPersonality || 'GENTLE';
    const contextHint = dto.include_context ? ' I have included your current habit context.' : '';
    const content = this.generateLocalResponse(personality, dto.message, contextHint);

    return this.chatMessageRepository.save(
      this.chatMessageRepository.create({
        userId,
        role: 'assistant',
        content,
      }),
    );
  }

  private generateLocalResponse(personality: string, message: string, contextHint: string) {
    if (personality === 'STRICT') {
      return `Pick the next concrete action and do it now. You said: "${message}".${contextHint}`;
    }
    if (personality === 'HUMOROUS') {
      return `Solid. Choose one tiny habit and give it five focused minutes. You said: "${message}".${contextHint}`;
    }
    return `I hear you. Start gently with the smallest next step you can take. You said: "${message}".${contextHint}`;
  }
}
