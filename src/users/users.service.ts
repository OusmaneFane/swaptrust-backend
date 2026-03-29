import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { maskPhone } from '../common/utils/mask-phone';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async listForAdmin(skip = 0, take = 50, search?: string) {
    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          kycStatus: true,
          role: true,
          isBanned: true,
          ratingAvg: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async getPublicProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ratingAvg: true,
        transactionsCount: true,
        countryResidence: true,
        avatar: true,
        kycStatus: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getReviewsForUser(userId: number) {
    return this.prisma.review.findMany({
      where: { reviewedId: userId },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phoneMali: true,
        phoneRussia: true,
        countryResidence: true,
        avatar: true,
        kycStatus: true,
      },
    });
  }

  async setAvatar(userId: number, relativePath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: relativePath },
      select: { id: true, avatar: true },
    });
  }

  async deleteMe(userId: number) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  sanitizePhones<T extends { phoneMali?: string | null; phoneRussia?: string | null }>(
    obj: T,
    mask: boolean,
  ): T {
    if (!mask) return obj;
    return {
      ...obj,
      phoneMali: obj.phoneMali ? maskPhone(obj.phoneMali) : obj.phoneMali,
      phoneRussia: obj.phoneRussia ? maskPhone(obj.phoneRussia) : obj.phoneRussia,
    };
  }

  async assertAdminView(userId: number, targetId: number) {
    if (userId !== targetId) {
      const u = await this.prisma.user.findUnique({ where: { id: userId } });
      if (u?.role !== UserRole.ADMIN) throw new ForbiddenException();
    }
  }
}
