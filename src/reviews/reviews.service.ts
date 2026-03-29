import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createForTransaction(transactionId: number, reviewerId: number, dto: CreateReviewDto) {
    const t = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new NotFoundException();
    if (t.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Transaction not completed');
    }
    if (t.clientId !== reviewerId && t.operatorId !== reviewerId) {
      throw new ForbiddenException();
    }
    const reviewedId = t.clientId === reviewerId ? t.operatorId : t.clientId;
    const existing = await this.prisma.review.findUnique({ where: { transactionId } });
    if (existing) throw new ConflictException('Review already exists');

    const review = await this.prisma.review.create({
      data: {
        transactionId,
        reviewerId,
        reviewedId,
        rating: dto.rating,
        comment: dto.comment,
        tags: (dto.tags ?? []) as Prisma.InputJsonValue,
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { reviewedId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.user.update({
      where: { id: reviewedId },
      data: { ratingAvg: agg._avg.rating ?? dto.rating },
    });

    return review;
  }

  async listForUser(userId: number) {
    return this.prisma.review.findMany({
      where: { reviewedId: userId },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
