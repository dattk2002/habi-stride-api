import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { UserSetting } from '../entity/user-setting.entity';
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
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
    @InjectRepository(UserStat)
    private readonly userStatRepository: Repository<UserStat>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        setting: true,
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
        setting: true,
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

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      user.email = dto.email;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.userRepository.save(user);

    if (dto.botPersonality) {
      let setting = await this.userSettingRepository.findOne({ where: { userId: id } });
      if (!setting) {
        setting = this.userSettingRepository.create({ userId: id });
      }
      setting.botPersonality = dto.botPersonality;
      await this.userSettingRepository.save(setting);
    }

    return this.findOne(id);
  }

  async delete(currentUserId: string, id: string, dto: DeleteUserDto) {
    this.ensureOwnUser(currentUserId, id);
    const reason = dto?.reason?.trim();
    if (!reason) {
      throw new BadRequestException('Delete reason is required');
    }

    await this.findOne(id);

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
      await manager.delete(UserSetting, { userId: id });
      await manager.delete(UserStat, { userId: id });
      await manager.delete(User, { id });
    });

    return {
      deleted: true,
      id,
      reason,
    };
  }

  private ensureOwnUser(currentUserId: string, id: string) {
    if (currentUserId !== id) {
      throw new ForbiddenException('You can only update or delete your own user');
    }
  }
}
