import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLog } from './entity/daily-log.entity';
import { HabitStat } from './entity/habit-stat.entity';
import { Habit } from './entity/habit.entity';
import { History } from './entity/history.entity';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { DailyLogCronService } from './daily-log-cron.service';
import { TreeModule } from '../tree/tree.module';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Habit, DailyLog, HabitStat, History]), TreeModule],
  controllers: [HabitsController],
  providers: [HabitsService, DailyLogCronService],
  exports: [HabitsService],
})
export class HabitsModule {}
