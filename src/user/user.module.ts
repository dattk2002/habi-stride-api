import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserStat } from './entity/user-stat.entity';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { Habit } from '../habits/entity/habit.entity';
import { DailyLog } from '../habits/entity/daily-log.entity';
import { History } from '../habits/entity/history.entity';
import { HabitStat } from '../habits/entity/habit-stat.entity';
import { ChatMessage } from '../chat/entity/chat-message.entity';
import { UserTree } from '../tree/entity/user-tree.entity';
import { UserAchievement } from '../tree/entity/user-achievement.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      UserStat,
      Habit,
      DailyLog,
      History,
      HabitStat,
      ChatMessage,
      UserTree,
      UserAchievement,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
