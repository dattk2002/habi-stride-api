import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { HabitCategory } from '../enums/habit-category.enum';
import { HabitFrequency } from '../enums/habit-frequency.enum';

@Entity('habits')
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: HabitCategory.OTHER })
  category: HabitCategory;

  @Column({ default: 'circle' })
  icon: string;

  @Column({ type: 'varchar', default: HabitFrequency.DAILY })
  frequency: HabitFrequency;

  @Column({ name: 'schedule_days', type: 'jsonb', default: () => "'[0,1,2,3,4,5,6]'::jsonb" })
  scheduleDays: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
