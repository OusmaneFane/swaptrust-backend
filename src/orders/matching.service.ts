import { Injectable } from '@nestjs/common';
import { OrderType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  private band(low: bigint, high: bigint) {
    return { gte: low, lte: high };
  }

  /** Ordres opposés dont les montants croisés sont dans une fenêtre de ±10 %. */
  async findMatches(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== OrderStatus.ACTIVE) return [];

    const opposite: OrderType =
      order.type === OrderType.SEND_CFA ? OrderType.SEND_RUB : OrderType.SEND_CFA;

    const tolFrom = (order.amountFrom * 10n) / 100n;
    const tolTo = (order.amountTo * 10n) / 100n;

    const where: Prisma.OrderWhereInput = {
      id: { not: order.id },
      userId: { not: order.userId },
      status: OrderStatus.ACTIVE,
      type: opposite,
      currencyFrom: order.currencyTo,
      currencyTo: order.currencyFrom,
      AND: [
        { amountFrom: this.band(order.amountTo - tolTo, order.amountTo + tolTo) },
        { amountTo: this.band(order.amountFrom - tolFrom, order.amountFrom + tolFrom) },
      ],
    };

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            ratingAvg: true,
            kycStatus: true,
          },
        },
      },
    });
  }
}
