import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('history')
@Unique(['habitId', 'date'])
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'habit_id' })
  habitId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  checked: boolean;
}
