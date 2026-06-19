import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateBotPersonalityDto } from './dto/update-bot-personality.dto';
import { BotPersonality } from '../user/enums/bot-personality.enum';
import { UserSetting } from '../user/entity/user-setting.entity';
import { UserStat } from '../user/entity/user-stat.entity';
import { User } from '../user/entity/user.entity';
import { UserTree } from '../tree/entity/user-tree.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
    @InjectRepository(UserStat)
    private readonly userStatRepository: Repository<UserStat>,
    @InjectRepository(UserTree)
    private readonly userTreeRepository: Repository<UserTree>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userRepository.save(
      this.userRepository.create({
        email: registerDto.email,
        passwordHash,
      }),
    );

    await this.userSettingRepository.save(
      this.userSettingRepository.create({
        userId: user.id,
        botPersonality: registerDto.botPersonality || BotPersonality.GENTLE,
      }),
    );

    await this.userStatRepository.save(
      this.userStatRepository.create({
        userId: user.id,
        totalHabitsDone: 0,
        highestStreak: 0,
      }),
    );

    await this.userTreeRepository.save(
      this.userTreeRepository.create({
        userId: user.id,
        stage: 0,
        branch: 'nature',
        exp: 0,
        items: [],
      }),
    );

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async updateBotPersonality(userId: string, dto: UpdateBotPersonalityDto) {
    let setting = await this.userSettingRepository.findOne({ where: { userId } });
    if (!setting) {
      setting = this.userSettingRepository.create({ userId });
    }

    setting.botPersonality = dto.botPersonality;
    return this.userSettingRepository.save(setting);
  }

  private async buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'local-access-secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as never,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'local-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as never,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}
