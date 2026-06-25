import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { UserStat } from './user-stat.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'auth_provider', default: 'local' })
  authProvider: 'local' | 'google';

  @Column({ name: 'google_subject', type: 'varchar', nullable: true, unique: true })
  googleSubject: string | null;

  @Column({ name: 'email_verified', default: true })
  emailVerified: boolean;

  @Column({ name: 'display_name', type: 'varchar', length: 60, nullable: true })
  displayName: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'profile_completed', default: false })
  profileCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => UserStat, (stat) => stat.user)
  stat: UserStat;
}
