import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiQuery({ name: 'from', required: false, example: '2026-06-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-06-30' })
  @Get('overview')
  overview(
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.overview(user.sub, from, to);
  }

  @ApiOperation({ summary: 'Get contribution heatmap data' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @Get('heatmap')
  heatmap(@CurrentUser() user: CurrentUserPayload, @Query('year') year?: string) {
    return this.analyticsService.heatmap(user.sub, year);
  }

  @ApiOperation({ summary: 'Export analytics as CSV or PDF' })
  @ApiQuery({ name: 'format', required: false, example: 'csv' })
  @ApiQuery({ name: 'from', required: false, example: '2026-06-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-06-30' })
  @Get('export')
  async export(
    @CurrentUser() user: CurrentUserPayload,
    @Res() response: Response,
    @Query('format') format?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.analyticsService.export(user.sub, format, from, to);
    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    response.send(result.body);
  }

  @ApiOperation({ summary: 'Get one habit analytics detail' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'period', required: false, example: 'month' })
  @Get('habit/:id')
  habitDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('period') period?: string,
  ) {
    return this.analyticsService.habitDetail(user.sub, id, period);
  }
}
