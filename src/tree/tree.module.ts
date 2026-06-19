import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAchievement } from './entity/user-achievement.entity';
import { UserTree } from './entity/user-tree.entity';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([UserTree, UserAchievement])],
  controllers: [TreeController],
  providers: [TreeService],
  exports: [TreeService, TypeOrmModule],
})
export class TreeModule {}
