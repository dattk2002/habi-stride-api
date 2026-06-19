import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('habit_stats')
export class HabitStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'habit_id', unique: true })
  habitId: string;

  @Column({ name: 'current_streak', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @Column({ name: 'total_checked', default: 0 })
  totalChecked: number;
}
