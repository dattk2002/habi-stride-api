import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHabitDto } from './dto/create-habit.dto';
import { DailyLog } from './entity/daily-log.entity';
import { HabitStat } from './entity/habit-stat.entity';
import { Habit } from './entity/habit.entity';
import { History } from './entity/history.entity';
import { HabitFrequency } from './enums/habit-frequency.enum';
import { TreeService } from '../tree/tree.service';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(DailyLog)
    private readonly dailyLogRepository: Repository<DailyLog>,
    @InjectRepository(HabitStat)
    private readonly habitStatRepository: Repository<HabitStat>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    private readonly treeService: TreeService,
  ) {}

  async findAll(userId: string) {
    const habits = await this.habitRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    const today = this.formatDate(new Date());
    const logs = await this.dailyLogRepository.find({ where: { userId, date: today } });
    const stats =
      habits.length === 0
        ? []
        : await this.habitStatRepository.find({
            where: habits.map((habit) => ({ habitId: habit.id })),
          });

    return habits.map((habit) => ({
      ...habit,
      checkedToday: logs.some((log) => log.habitId === habit.id && log.checked),
      stats: stats.find((stat) => stat.habitId === habit.id) || null,
    }));
  }

  async create(userId: string, dto: CreateHabitDto) {
    const habit = await this.habitRepository.save(
      this.habitRepository.create({
        userId,
        name: dto.name,
        category: dto.category,
        icon: dto.icon || 'circle',
        frequency: dto.frequency || HabitFrequency.DAILY,
      }),
    );

    await this.habitStatRepository.save(
      this.habitStatRepository.create({
        habitId: habit.id,
        currentStreak: 0,
        longestStreak: 0,
        totalChecked: 0,
      }),
    );

    return habit;
  }

  async checkToday(userId: string, habitId: string) {
    const habit = await this.habitRepository.findOne({ where: { id: habitId } });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    if (habit.userId !== userId) {
      throw new ForbiddenException('Cannot check another user habit');
    }

    const today = this.formatDate(new Date());
    let log = await this.dailyLogRepository.findOne({ where: { habitId, date: today } });
    const wasAlreadyChecked = Boolean(log?.checked);

    if (!log) {
      log = this.dailyLogRepository.create({ habitId, userId, date: today, checked: true });
    }
    log.checked = true;
    await this.dailyLogRepository.save(log);

    const stat = await this.updateStreak(habitId, today, wasAlreadyChecked);
    const exp = wasAlreadyChecked
      ? { expGained: 0, milestoneBonus: 0, tree: await this.treeService.getTree(userId) }
      : await this.treeService.addHabitExp(userId, habit.category, stat.currentStreak);

    return {
      habitId,
      date: today,
      checked: true,
      exp_gained: exp.expGained,
      milestone_bonus: exp.milestoneBonus,
      stats: stat,
      tree: exp.tree,
    };
  }

  async getDailyLog(userId: string, date?: string) {
    const targetDate = date || this.formatDate(new Date());
    const habits = await this.habitRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    const logs = await this.dailyLogRepository.find({ where: { userId, date: targetDate } });

    return {
      date: targetDate,
      checked_count: logs.filter((log) => log.checked).length,
      total_habits: habits.length,
      habits: habits.map((habit) => ({
        ...habit,
        checked: logs.some((log) => log.habitId === habit.id && log.checked),
      })),
    };
  }

  async snapshotDailyLogs(date = this.formatDate(new Date())) {
    const logs = await this.dailyLogRepository.find({ where: { date } });
    const historyRows: History[] = [];

    for (const log of logs) {
      const exists = await this.historyRepository.findOne({ where: { habitId: log.habitId, date: log.date } });
      if (!exists) {
        historyRows.push(
          this.historyRepository.create({
            habitId: log.habitId,
            userId: log.userId,
            date: log.date,
            checked: log.checked,
          }),
        );
      }
    }

    if (historyRows.length > 0) {
      await this.historyRepository.save(historyRows);
    }

    return { date, snapshotted: historyRows.length };
  }

  private async updateStreak(habitId: string, today: string, wasAlreadyChecked: boolean) {
    let stat = await this.habitStatRepository.findOne({ where: { habitId } });
    if (!stat) {
      stat = this.habitStatRepository.create({ habitId });
    }

    if (!wasAlreadyChecked) {
      const yesterday = this.formatDate(this.addDays(new Date(today), -1));
      const yesterdayLog = await this.dailyLogRepository.findOne({ where: { habitId, date: yesterday, checked: true } });
      stat.currentStreak = yesterdayLog ? stat.currentStreak + 1 : 1;
      stat.longestStreak = Math.max(stat.longestStreak, stat.currentStreak);
      stat.totalChecked += 1;
    }

    return this.habitStatRepository.save(stat);
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }
}
