import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerification } from './entity/email-verification.entity';
import { MailModule } from '../mail/mail.module';
import { UserStat } from '../user/entity/user-stat.entity';
import { User } from '../user/entity/user.entity';
import { UserTree } from '../tree/entity/user-tree.entity';
import { UserAchievement } from '../tree/entity/user-achievement.entity';

@Module({
  imports: [JwtModule.register({}), MailModule, TypeOrmModule.forFeature([User, UserStat, UserTree, UserAchievement, EmailVerification])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
