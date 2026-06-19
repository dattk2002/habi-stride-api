import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from './entity/chat-message.entity';
import { UserSetting } from '../user/entity/user-setting.entity';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([ChatMessage, UserSetting])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
