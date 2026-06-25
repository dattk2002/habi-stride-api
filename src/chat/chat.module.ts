import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from './entity/chat-message.entity';
import { Habit } from '../habits/entity/habit.entity';
import { HabitStat } from '../habits/entity/habit-stat.entity';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([ChatMessage, Habit, HabitStat])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
