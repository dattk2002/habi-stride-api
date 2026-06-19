import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UseItemDto } from './dto/use-item.dto';
import { TreeService } from './tree.service';

@ApiTags('tree')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @ApiOperation({ summary: 'Get virtual tree state' })
  @Get()
  getTree(@CurrentUser() user: CurrentUserPayload) {
    return this.treeService.getTree(user.sub);
  }

  @ApiOperation({ summary: 'Use an inventory item' })
  @Post('use-item')
  useItem(@CurrentUser() user: CurrentUserPayload, @Body() dto: UseItemDto) {
    return this.treeService.useItem(user.sub, dto.item);
  }
}
