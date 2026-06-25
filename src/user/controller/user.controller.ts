import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Patch(':id')
  async update(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(currentUser.sub, id, dto);
  }

  @ApiOperation({ summary: 'Upload the current user avatar' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.userService.uploadAvatar(currentUser.sub, id, file);
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @Delete(':id')
  async delete(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteUserDto,
  ) {
    return this.userService.delete(currentUser.sub, id, dto);
  }
}
