import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAchievement } from './entity/user-achievement.entity';
import { UserTree } from './entity/user-tree.entity';

const STAGE_THRESHOLDS = [0, 100, 300, 700, 1500];
const DROP_ITEMS = ['fertilizer', 'magic_water', 'decorative_pot'];

@Injectable()
export class TreeService {
  constructor(
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
  ) {}

  async getTree(userId: string) {
    const tree = await this.ensureTree(userId);
    const achievements = await this.userAchievementRepository.find({
      where: { userId },
      order: { unlockedAt: 'DESC' },
    });

    return {
      ...tree,
      next_stage_exp: STAGE_THRESHOLDS[Math.min(tree.stage + 1, STAGE_THRESHOLDS.length - 1)],
      achievements,
    };
  }

  async addHabitExp(userId: string, branchSource: string, currentStreak: number) {
    const milestoneBonus = currentStreak > 0 && currentStreak % 7 === 0 ? 50 : 0;
    const expGained = 10 + milestoneBonus;
    const tree = await this.ensureTree(userId);
    const oldStage = tree.stage;

    tree.exp += expGained;
    tree.branch = this.resolveBranch(branchSource);
    tree.stage = this.resolveStage(tree.exp);

    if (tree.stage > oldStage) {
      tree.items = [...(tree.items || []), DROP_ITEMS[tree.stage % DROP_ITEMS.length]];
      await this.unlockAchievement(userId, `tree_stage_${tree.stage}`);
    }

    if (currentStreak === 7) {
      await this.unlockAchievement(userId, 'first_7_day_streak');
    }

    return {
      expGained,
      milestoneBonus,
      tree: await this.userTreeRepository.save(tree),
    };
  }

  async useItem(userId: string, item: string) {
    const tree = await this.ensureTree(userId);
    if (!tree.items?.includes(item)) {
      throw new BadRequestException('Item is not available in inventory');
    }

    tree.items = tree.items.filter((inventoryItem) => inventoryItem !== item);
    if (item === 'magic_water') {
      tree.exp += 200;
    }
    if (item === 'fertilizer') {
      tree.exp += 50;
    }
    tree.stage = this.resolveStage(tree.exp);

    return this.userTreeRepository.save(tree);
  }

  private async ensureTree(userId: string) {
    let tree = await this.userTreeRepository.findOne({ where: { userId } });
    if (!tree) {
      tree = await this.userTreeRepository.save(
        this.userTreeRepository.create({
          userId,
          stage: 0,
          branch: 'nature',
          exp: 0,
          items: [],
        }),
      );
    }
    return tree;
  }

  private resolveStage(exp: number) {
    let stage = 0;
    for (let index = 0; index < STAGE_THRESHOLDS.length; index += 1) {
      if (exp >= STAGE_THRESHOLDS[index]) {
        stage = index;
      }
    }
    return stage;
  }

  private resolveBranch(category: string) {
    if (category === 'code') {
      return 'tech';
    }
    if (category === 'knowledge') {
      return 'scholar';
    }
    return 'nature';
  }

  private async unlockAchievement(userId: string, achievementKey: string) {
    const exists = await this.userAchievementRepository.findOne({ where: { userId, achievementKey } });
    if (!exists) {
      await this.userAchievementRepository.save(
        this.userAchievementRepository.create({ userId, achievementKey }),
      );
    }
  }
}
