import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserStat } from '../entity/user-stat.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { Habit } from '../../habits/entity/habit.entity';
import { DailyLog } from '../../habits/entity/daily-log.entity';
import { History } from '../../habits/entity/history.entity';
import { HabitStat } from '../../habits/entity/habit-stat.entity';
import { ChatMessage } from '../../chat/entity/chat-message.entity';
import { UserTree } from '../../tree/entity/user-tree.entity';
import { UserAchievement } from '../../tree/entity/user-achievement.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStat)
    private readonly userStatRepository: Repository<UserStat>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        stat: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        stat: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(currentUserId: string, id: string, dto: UpdateUserDto): Promise<User> {
    this.ensureOwnUser(currentUserId, id);
    const user = await this.findOne(id);

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const email = dto.email.trim().toLowerCase();
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      user.email = email;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName.trim();
      user.profileCompleted = Boolean(user.displayName && user.avatarUrl);
    }

    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async delete(currentUserId: string, id: string, dto: DeleteUserDto) {
    this.ensureOwnUser(currentUserId, id);
    const user = await this.findOne(id);
    if (dto.email.trim().toLowerCase() !== user.email) {
      throw new BadRequestException('Email confirmation does not match this account');
    }

    await this.dataSource.transaction(async (manager) => {
      const habits = await manager.find(Habit, { where: { userId: id }, select: { id: true } });
      const habitIds = habits.map((habit) => habit.id);

      if (habitIds.length > 0) {
        await manager.delete(HabitStat, { habitId: In(habitIds) });
      }

      await manager.delete(ChatMessage, { userId: id });
      await manager.delete(DailyLog, { userId: id });
      await manager.delete(History, { userId: id });
      await manager.delete(Habit, { userId: id });
      await manager.delete(UserAchievement, { userId: id });
      await manager.delete(UserTree, { userId: id });
      await manager.delete(UserStat, { userId: id });
      await manager.delete(User, { id });
    });

    return {
      deleted: true,
      id,
    };
  }

  async uploadAvatar(currentUserId: string, id: string, file?: { buffer: Buffer; mimetype: string; size: number }) {
    this.ensureOwnUser(currentUserId, id);
    if (!file) throw new BadRequestException('Avatar image is required');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Avatar must be a JPEG, PNG, or WebP image');
    }
    if (file.size > 2 * 1024 * 1024) throw new BadRequestException('Avatar must be 2 MB or smaller');

    const user = await this.findOne(id);
    user.avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    user.profileCompleted = Boolean(user.displayName && user.avatarUrl);
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  private ensureOwnUser(currentUserId: string, id: string) {
    if (currentUserId !== id) {
      throw new ForbiddenException('You can only update or delete your own user');
    }
  }
}
