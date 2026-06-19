import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { HabitStat } from '../habits/entity/habit-stat.entity';
import { Habit } from '../habits/entity/habit.entity';
import { History } from '../habits/entity/history.entity';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Habit, HabitStat, History])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
