import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class NotificationsService {
  private mailer: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');
    if (host && user && pass) {
      this.mailer = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port') ?? 587,
        auth: { user, pass },
      });
    }
  }

  async createInApp(
    userId: number,
    type: string,
    title: string,
    body: string,
    data?: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });
  }

  async notifyEmail(userEmail: string, subject: string, text: string) {
    if (!this.mailer) return;
    const from = this.config.get<string>('mail.from');
    await this.mailer.sendMail({ from, to: userEmail, subject, text });
  }

  async list(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: number, id: number) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException();
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: true };
  }

  async remove(userId: number, id: number) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException();
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }

  async getPreferences(userId: number) {
    let p = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (!p) {
      p = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return p;
  }

  async updatePreferences(userId: number, dto: UpdatePreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }
}
