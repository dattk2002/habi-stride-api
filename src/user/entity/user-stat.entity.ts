import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_stats')
export class UserStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'total_habits_done', default: 0 })
  totalHabitsDone: number;

  @Column({ name: 'highest_streak', default: 0 })
  highestStreak: number;

  @Column({ name: 'total_login_days', default: 0 })
  totalLoginDays: number;

  @Column({ name: 'current_login_streak', default: 0 })
  currentLoginStreak: number;

  @Column({ name: 'last_login_date', type: 'date', nullable: true })
  lastLoginDate: string | null;

  @OneToOne(() => User, (user) => user.stat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
