import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KycStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { normalizeToE164WithCallingCode } from '../common/utils/phone-e164';

const OTP_TTL_SEC = 300;
const OTP_FALLBACK = new Map<string, { code: string; exp: number }>();
const RESET_TTL_MIN = 30;

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

  private appUrl(): string {
    return this.config.get<string>('app.url') ?? 'https://donisend.com';
  }

  private resetTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async requestPasswordReset(emailRaw: string) {
    const email = (emailRaw ?? '').trim().toLowerCase();
    // Réponse uniforme: ne pas révéler si l'email existe.
    const okResponse = { sent: true };

    if (!email) return okResponse;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, phoneMali: true, phoneRussia: true, isBanned: true },
    });
    if (!user || user.isBanned) return okResponse;

    const phone = clientWhatsappPhone(user);
    if (!phone) return okResponse;

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.resetTokenHash(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

    // Invalider les tokens précédents non utilisés (hygiène)
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${this.appUrl().replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    void this.whatsapp
      .sendPasswordResetLink({
        user: { name: user.name, phone },
        resetUrl,
        expiresInMin: RESET_TTL_MIN,
      })
      .catch(() => {});

    return okResponse;
  }

  async validatePasswordResetToken(token: string) {
    const raw = (token ?? '').trim();
    if (!raw) return { valid: false };
    const tokenHash = this.resetTokenHash(raw);
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true } } },
    });
    if (!row) return { valid: false };
    if (row.usedAt) return { valid: false };
    if (row.expiresAt.getTime() <= Date.now()) return { valid: false };
    return { valid: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const raw = (token ?? '').trim();
    if (!raw) throw new UnauthorizedException('Invalid token');
    const tokenHash = this.resetTokenHash(raw);

    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: row.userId },
        data: { password: passwordHash, refreshToken: null },
      });
      await tx.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
    });

    return { reset: true };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const password = await bcrypt.hash(dto.password, 12);

    // Nouveau flux: `phone` + `countryCallingCode` pour supporter tous pays.
    // Rétro-compat: si `phone` absent, on garde phoneMali/phoneRussia.
    const phoneMain =
      normalizeToE164WithCallingCode(dto.phone ?? '', dto.countryCallingCode) ??
      normalizeToE164WithCallingCode(dto.phoneMali ?? '', null) ??
      normalizeToE164WithCallingCode(dto.phoneRussia ?? '', null) ??
      null;

    if (phoneMain) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneMain },
            // Rétro-compat: couvrir les anciennes colonnes si elles contiennent un E.164 identique
            { phoneMali: phoneMain },
            { phoneRussia: phoneMain },
          ],
        },
        select: { id: true },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password,
        phone: phoneMain,
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
        phone: true,
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
