import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KycStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';

const OTP_TTL_SEC = 300;
const OTP_FALLBACK = new Map<string, { code: string; exp: number }>();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private sms: SmsService,
    private readonly whatsapp: WhatsappService,
  ) {}

  private async signAccessToken(userId: number, role: UserRole) {
    return this.jwt.signAsync(
      { sub: userId, role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpires') as `${number}m` | `${number}d`,
      },
    );
  }

  private async signRefreshToken(userId: number) {
    return this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpires') as `${number}m` | `${number}d`,
      },
    );
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const password = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        phoneMali: dto.phoneMali,
        phoneRussia: dto.phoneRussia,
        countryResidence: dto.countryResidence,
        kycStatus: KycStatus.VERIFIED,
      },
    });
    const refreshToken = await this.signRefreshToken(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    const accessToken = await this.signAccessToken(user.id, user.role);
    const phone = clientWhatsappPhone(user);
    void this.whatsapp
      .sendWelcome({ name: user.name, phone })
      .catch(() => {});
    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned) throw new UnauthorizedException('Account suspended');
    const refreshToken = await this.signRefreshToken(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    const accessToken = await this.signAccessToken(user.id, user.role);
    return { accessToken, refreshToken };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { loggedOut: true };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException();
    }
    const newRefresh = await this.signRefreshToken(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefresh },
    });
    const accessToken = await this.signAccessToken(user.id, user.role);
    return { accessToken, refreshToken: newRefresh };
  }

  async sendOtp(phone: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = `otp:${phone}`;
    await this.redis.setex(key, OTP_TTL_SEC, code);
    const fromRedis = await this.redis.get(key);
    if (fromRedis === null) {
      OTP_FALLBACK.set(phone, { code, exp: Date.now() + OTP_TTL_SEC * 1000 });
    }
    await this.sms.sendOtp(phone, code);
    return { sent: true };
  }

  async verifyOtp(phone: string, code: string) {
    const key = `otp:${phone}`;
    let expected = await this.redis.get(key);
    if (expected === null) {
      const fb = OTP_FALLBACK.get(phone);
      if (!fb || fb.exp < Date.now()) throw new UnauthorizedException('Invalid OTP');
      expected = fb.code;
      if (expected !== code) throw new UnauthorizedException('Invalid OTP');
      OTP_FALLBACK.delete(phone);
      return { verified: true };
    }
    if (expected !== code) throw new UnauthorizedException('Invalid OTP');
    await this.redis.del(key);
    return { verified: true };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneMali: true,
        phoneRussia: true,
        countryResidence: true,
        avatar: true,
        kycStatus: true,
        role: true,
        ratingAvg: true,
        transactionsCount: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
