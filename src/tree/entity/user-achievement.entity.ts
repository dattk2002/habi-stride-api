import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('user_achievements')
@Unique(['userId', 'achievementKey'])
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'achievement_key' })
  achievementKey: string;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt: Date;
}
