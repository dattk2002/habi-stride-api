import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserSetting } from '../user/entity/user-setting.entity';
import { UserStat } from '../user/entity/user-stat.entity';
import { User } from '../user/entity/user.entity';
import { UserTree } from '../tree/entity/user-tree.entity';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([User, UserSetting, UserStat, UserTree])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
