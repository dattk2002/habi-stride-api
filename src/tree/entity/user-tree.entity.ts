import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_tree')
export class UserTree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ default: 0 })
  stage: number;

  @Column({ default: 'nature' })
  branch: string;

  @Column({ default: 0 })
  exp: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  items: string[];
}
