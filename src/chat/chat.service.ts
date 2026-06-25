import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatDto } from './dto/chat.dto';
import { ChatMessage } from './entity/chat-message.entity';
import { Habit } from '../habits/entity/habit.entity';
import { HabitStat } from '../habits/entity/habit-stat.entity';

type GeneratedReply = { content: string; provider: 'gemini' | 'local-fallback' };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(HabitStat)
    private readonly habitStatRepository: Repository<HabitStat>,
  ) {}

  async chat(userId: string, dto: ChatDto) {
    const result = await this.createAssistantMessage(userId, dto);
    return { userMessage: result.userMessage, message: result.message, provider: result.provider, streaming: false };
  }

  getHistory(userId: string) {
    return this.chatMessageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createAssistantMessage(userId: string, dto: ChatDto) {
    const userMessage = await this.chatMessageRepository.save(
      this.chatMessageRepository.create({ userId, role: 'user', content: dto.message }),
    );
    const reply = await this.generateReply(userId, dto);
    const message = await this.chatMessageRepository.save(
      this.chatMessageRepository.create({ userId, role: 'assistant', content: reply.content }),
    );
    return { userMessage, message, provider: reply.provider };
  }

  private async generateReply(userId: string, dto: ChatDto): Promise<GeneratedReply> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return { content: this.localResponse(), provider: 'local-fallback' };

    try {
      const ai = new GoogleGenAI({ apiKey });
      const context = dto.include_context ? await this.buildHabitContext(userId) : 'No habit context requested.';
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: dto.message,
        config: {
          systemInstruction: this.systemInstruction(context),
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      });
      const content = response.text?.trim();
      if (!content) throw new Error('Gemini returned an empty response');
      return { content, provider: 'gemini' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Gemini error';
      this.logger.warn(`Gemini request failed; using local fallback: ${reason}`);
      return { content: this.localResponse(), provider: 'local-fallback' };
    }
  }

  private async buildHabitContext(userId: string) {
    const habits = await this.habitRepository.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
    if (!habits.length) return 'The user has no habits yet.';
    const stats = await this.habitStatRepository.find({ where: habits.map((habit) => ({ habitId: habit.id })) });
    return habits.map((habit) => {
      const stat = stats.find((item) => item.habitId === habit.id);
      return `- ${habit.name}; category=${habit.category}; scheduleDays=${(habit.scheduleDays || []).join(',')}; currentStreak=${stat?.currentStreak || 0}; totalChecked=${stat?.totalChecked || 0}`;
    }).join('\n');
  }

  private systemInstruction(context: string) {
    return `You are HabiStride, a calm and practical habit coach. Reply in the same language as the user. Give concise, actionable guidance, do not diagnose medical conditions, and never invent progress data. Use the context only when relevant.\n\nUser habit context:\n${context}`;
  }

  private localResponse() {
    return 'Hãy bắt đầu nhẹ nhàng với bước nhỏ nhất bạn có thể làm trong 5 phút tới.';
  }
}
