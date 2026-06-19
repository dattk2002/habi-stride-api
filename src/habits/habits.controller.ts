import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitsService } from './habits.service';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @ApiOperation({ summary: 'Get authenticated user habits' })
  @Get('habits')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.habitsService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Create a habit' })
  @Post('habits')
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Check a habit for today and trigger streak/EXP engines' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch('habits/:id/check')
  checkToday(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.habitsService.checkToday(user.sub, id);
  }

  @ApiOperation({ summary: 'Get daily log for a specific date' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-20' })
  @Get('daily-log')
  getDailyLog(@CurrentUser() user: CurrentUserPayload, @Query('date') date?: string) {
    return this.habitsService.getDailyLog(user.sub, date);
  }

  @ApiOperation({ summary: 'Snapshot daily logs into history manually' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-20' })
  @Post('daily-log/snapshot')
  snapshotDailyLogs(@Query('date') date?: string) {
    return this.habitsService.snapshotDailyLogs(date);
  }
}
