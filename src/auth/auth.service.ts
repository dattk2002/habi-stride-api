import { randomInt } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailOtpDto } from './dto/request-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { EmailVerification } from './entity/email-verification.entity';
import { MailService } from '../mail/mail.service';
import { UserStat } from '../user/entity/user-stat.entity';
import { User } from '../user/entity/user.entity';
import { UserTree } from '../tree/entity/user-tree.entity';
import { UserAchievement } from '../tree/entity/user-achievement.entity';

const LOGIN_REWARD_ITEMS = ['magic_water', 'fertilizer', 'decorative_pot'];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserStat) private readonly userStatRepository: Repository<UserStat>,
    @InjectRepository(UserTree) private readonly userTreeRepository: Repository<UserTree>,
    @InjectRepository(UserAchievement) private readonly achievementRepository: Repository<UserAchievement>,
    @InjectRepository(EmailVerification) private readonly verificationRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async requestEmailVerification(dto: RequestEmailOtpDto) {
    const email = this.normalizeEmail(dto.email);
    if (await this.userRepository.findOne({ where: { email } })) throw new ConflictException('Email already exists');
    const previous = await this.verificationRepository.findOne({ where: { email }, order: { createdAt: 'DESC' } });
    if (previous && Date.now() - previous.createdAt.getTime() < 60_000) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.verificationRepository.delete({ email });
    const code = String(randomInt(100000, 1000000));
    await this.verificationRepository.save(this.verificationRepository.create({
      email,
      otpHash: await bcrypt.hash(code, 10),
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    }));
    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (error) {
      await this.verificationRepository.delete({ email });
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Unable to send verification email');
    }
    return { sent: true, expiresInSeconds: 600, resendAfterSeconds: 60 };
  }

  async verifyEmail(dto: VerifyEmailOtpDto) {
    const email = this.normalizeEmail(dto.email);
    const verification = await this.verificationRepository.findOne({ where: { email }, order: { createdAt: 'DESC' } });
    if (!verification || verification.expiresAt.getTime() < Date.now()) throw new BadRequestException('Verification code is invalid or expired');
    if (verification.attempts >= 5) throw new BadRequestException('Too many verification attempts');
    verification.attempts += 1;
    await this.verificationRepository.save(verification);
    if (!(await bcrypt.compare(dto.code, verification.otpHash))) throw new BadRequestException('Verification code is invalid or expired');
    const verificationToken = await this.jwtService.signAsync(
      { email, purpose: 'email-verification' },
      { secret: process.env.EMAIL_VERIFICATION_SECRET || 'local-email-verification-secret', expiresIn: '15m' },
    );
    await this.verificationRepository.delete({ email });
    return { verified: true, verificationToken };
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    await this.assertVerificationToken(dto.verificationToken, email);
    if (await this.userRepository.findOne({ where: { email } })) throw new ConflictException('Email already exists');
    const user = await this.userRepository.save(this.userRepository.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      authProvider: 'local',
      googleSubject: null,
      emailVerified: true,
    }));
    await this.initializeUser(user.id);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userRepository.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email }).getOne();
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.buildAuthResponse(user);
  }

  async googleLogin(dto: GoogleAuthDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) throw new ServiceUnavailableException('Google login is not configured');
    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken: dto.credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new UnauthorizedException('Google email is not verified');
    const email = this.normalizeEmail(payload.email);
    let user = await this.userRepository.findOne({ where: [{ googleSubject: payload.sub }, { email }] });
    if (!user) {
      user = await this.userRepository.save(this.userRepository.create({
        email,
        passwordHash: null,
        authProvider: 'google',
        googleSubject: payload.sub,
        emailVerified: true,
      }));
      await this.initializeUser(user.id);
    } else if (!user.googleSubject) {
      user.googleSubject = payload.sub;
      user.emailVerified = true;
      await this.userRepository.save(user);
    }
    return this.buildAuthResponse(user);
  }

  private async initializeUser(userId: string) {
    await Promise.all([
      this.userStatRepository.save(this.userStatRepository.create({ userId, totalHabitsDone: 0, highestStreak: 0, totalLoginDays: 0, currentLoginStreak: 0, lastLoginDate: null })),
      this.userTreeRepository.save(this.userTreeRepository.create({ userId, stage: 0, branch: 'nature', exp: 0, items: [] })),
    ]);
  }

  private async assertVerificationToken(token: string, email: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ email: string; purpose: string }>(token, {
        secret: process.env.EMAIL_VERIFICATION_SECRET || 'local-email-verification-secret',
      });
      if (payload.email !== email || payload.purpose !== 'email-verification') throw new Error('Invalid purpose');
    } catch {
      throw new UnauthorizedException('Email verification is required');
    }
  }

  private normalizeEmail(email: string) { return email.trim().toLowerCase(); }

  private async buildAuthResponse(user: User) {
    const loginReward = await this.recordLogin(user.id);
    const currentUser = await this.userRepository.findOne({ where: { id: user.id }, relations: { stat: true } });
    if (!currentUser) throw new UnauthorizedException('User no longer exists');
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET || 'local-access-secret', expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as never });
    const refreshToken = await this.jwtService.signAsync(payload, { secret: process.env.JWT_REFRESH_SECRET || 'local-refresh-secret', expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as never });
    return {
      accessToken,
      refreshToken,
      loginReward,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        profileCompleted: currentUser.profileCompleted,
        createdAt: currentUser.createdAt,
        authProvider: currentUser.authProvider,
        emailVerified: currentUser.emailVerified,
        stat: currentUser.stat,
      },
    };
  }

  private async recordLogin(userId: string) {
    let stat = await this.userStatRepository.findOne({ where: { userId } });
    if (!stat) stat = this.userStatRepository.create({ userId });
    const today = new Date().toISOString().slice(0, 10);
    if (stat.lastLoginDate === today) return null;

    const yesterday = new Date(`${today}T00:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    stat.currentLoginStreak = stat.lastLoginDate === yesterday.toISOString().slice(0, 10)
      ? (stat.currentLoginStreak || 0) + 1
      : 1;
    stat.totalLoginDays = (stat.totalLoginDays || 0) + 1;
    stat.lastLoginDate = today;
    await this.userStatRepository.save(stat);

    if (stat.currentLoginStreak % 7 !== 0) return null;
    const milestone = stat.currentLoginStreak;
    const item = LOGIN_REWARD_ITEMS[(milestone / 7 - 1) % LOGIN_REWARD_ITEMS.length];
    const tree = await this.userTreeRepository.findOne({ where: { userId } });
    if (tree) {
      tree.items = [...(tree.items || []), item];
      await this.userTreeRepository.save(tree);
    }
    const achievementKey = `login_streak_${milestone}`;
    if (!(await this.achievementRepository.findOne({ where: { userId, achievementKey } }))) {
      await this.achievementRepository.save(this.achievementRepository.create({ userId, achievementKey }));
    }
    return { milestone, item, achievementKey };
  }
}
