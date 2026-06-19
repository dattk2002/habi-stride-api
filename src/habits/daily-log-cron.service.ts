import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HabitsService } from './habits.service';

@Injectable()
export class DailyLogCronService {
  private readonly logger = new Logger(DailyLogCronService.name);

  constructor(private readonly habitsService: HabitsService) {}

  @Cron('0 0 * * *', { timeZone: 'Asia/Bangkok' })
  async snapshotYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);
    const result = await this.habitsService.snapshotDailyLogs(date);

    this.logger.log(`Snapshotted ${result.snapshotted} daily logs for ${date}`);
  }
}
