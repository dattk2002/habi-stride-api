import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { Between, Repository } from 'typeorm';
import { HabitStat } from '../habits/entity/habit-stat.entity';
import { Habit } from '../habits/entity/habit.entity';
import { History } from '../habits/entity/history.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
    @InjectRepository(HabitStat)
    private readonly habitStatRepository: Repository<HabitStat>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
  ) {}

  async overview(userId: string, from?: string, to?: string) {
    const range = this.resolveRange(from, to);
    const histories = await this.historyRepository.find({
      where: { userId, date: Between(range.from, range.to), checked: true },
    });
    const habits = await this.habitRepository.find({ where: { userId } });
    const stats =
      habits.length === 0
        ? []
        : await this.habitStatRepository.find({
            where: habits.map((habit) => ({ habitId: habit.id })),
          });
    const bestStreak = stats.reduce((max, stat) => Math.max(max, stat.longestStreak), 0);
    const mostConsistentHabit = this.resolveMostConsistentHabit(histories, habits);

    return {
      from: range.from,
      to: range.to,
      total_tasks_completed: histories.length,
      best_streak: bestStreak,
      most_consistent_habit: mostConsistentHabit,
    };
  }

  async heatmap(userId: string, year?: string) {
    const targetYear = Number(year || new Date().getFullYear());
    const from = `${targetYear}-01-01`;
    const to = `${targetYear}-12-31`;
    const histories = await this.historyRepository.find({
      where: { userId, date: Between(from, to), checked: true },
    });
    const counts = histories.reduce<Record<string, number>>((acc, history) => {
      acc[history.date] = (acc[history.date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  async habitDetail(userId: string, habitId: string, period = 'month') {
    const habit = await this.habitRepository.findOne({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      throw new NotFoundException('Habit not found');
    }

    const range = this.resolvePeriod(period);
    const histories = await this.historyRepository.find({
      where: { userId, habitId, date: Between(range.from, range.to) },
      order: { date: 'ASC' },
    });
    const checked = histories.filter((history) => history.checked).length;

    return {
      habit,
      period,
      from: range.from,
      to: range.to,
      checked,
      total_records: histories.length,
      completion_rate: histories.length === 0 ? 0 : checked / histories.length,
      history: histories,
    };
  }

  async export(userId: string, format = 'csv', from?: string, to?: string) {
    const range = this.resolveRange(from, to);
    const histories = await this.historyRepository.find({
      where: { userId, date: Between(range.from, range.to) },
      order: { date: 'ASC' },
    });
    const habits = await this.habitRepository.find({ where: { userId } });
    const rows = histories.map((history) => {
      const habit = habits.find((item) => item.id === history.habitId);
      return {
        date: history.date,
        habit_id: history.habitId,
        habit_name: habit?.name || '',
        checked: history.checked,
      };
    });

    if (format === 'pdf') {
      return {
        contentType: 'application/pdf',
        filename: `analytics-${range.from}-${range.to}.pdf`,
        body: await this.toPdf(rows, range.from, range.to),
      };
    }

    return {
      contentType: 'text/csv',
      filename: `analytics-${range.from}-${range.to}.csv`,
      body: this.toCsv(rows),
    };
  }

  private resolveMostConsistentHabit(histories: History[], habits: Habit[]) {
    const counts = histories.reduce<Record<string, number>>((acc, history) => {
      acc[history.habitId] = (acc[history.habitId] || 0) + 1;
      return acc;
    }, {});
    const [habitId, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    const habit = habits.find((item) => item.id === habitId);
    return habit ? { id: habit.id, name: habit.name, count } : null;
  }

  private resolveRange(from?: string, to?: string) {
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    return {
      from: from || this.formatDate(defaultFrom),
      to: to || this.formatDate(today),
    };
  }

  private resolvePeriod(period: string) {
    const today = new Date();
    const from = new Date(today);
    if (period === 'week') {
      from.setDate(from.getDate() - 7);
    } else if (period === '3months') {
      from.setMonth(from.getMonth() - 3);
    } else {
      from.setMonth(from.getMonth() - 1);
    }
    return { from: this.formatDate(from), to: this.formatDate(today) };
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toCsv(rows: Array<Record<string, string | boolean>>) {
    const headers = ['date', 'habit_id', 'habit_name', 'checked'];
    const lines = rows.map((row) =>
      headers
        .map((header) => String(row[header] ?? '').replace(/"/g, '""'))
        .map((value) => `"${value}"`)
        .join(','),
    );

    return [headers.join(','), ...lines].join('\n');
  }

  private toPdf(rows: Array<Record<string, string | boolean>>, from: string, to: string) {
    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('HabiStride Analytics Export');
      doc.moveDown();
      doc.fontSize(11).text(`Range: ${from} to ${to}`);
      doc.moveDown();

      if (rows.length === 0) {
        doc.text('No history records found for this range.');
      } else {
        rows.slice(0, 200).forEach((row) => {
          doc.text(`${row.date} | ${row.habit_name || row.habit_id} | checked=${row.checked}`);
        });
      }

      doc.end();
    });
  }
}
