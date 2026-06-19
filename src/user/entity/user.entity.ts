import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { UserSetting } from './user-setting.entity';
import { UserStat } from './user-stat.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => UserSetting, (setting) => setting.user)
  setting: UserSetting;

  @OneToOne(() => UserStat, (stat) => stat.user)
  stat: UserStat;
}
