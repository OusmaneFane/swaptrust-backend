import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { RatesService } from '../rates/rates.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private rates: RatesService,
    private config: ConfigService,
  ) {}

  private commissionPercent() {
    return this.config.get<number>('commission.platformPercent') ?? 2;
  }

  async create(userId: number, dto: CreateOrderDto) {
    const amountFrom = BigInt(dto.amountFrom);
    if (amountFrom <= 0n) throw new BadRequestException('Invalid amount');

    const baseRate = await this.rates.getRateDecimal(dto.currencyFrom, dto.currencyTo);
    const spread = this.config.get<number>('commission.spreadPercent') ?? 1;
    const adjusted = baseRate * (1 - spread / 100);
    const amountTo = BigInt(Math.round(Number(amountFrom) * adjusted));
    const commission = (amountFrom * BigInt(Math.round(this.commissionPercent() * 100))) / 10000n;

    return this.prisma.order.create({
      data: {
        userId,
        type: dto.type,
        amountFrom,
        currencyFrom: dto.currencyFrom,
        amountTo,
        currencyTo: dto.currencyTo,
        rate: new Prisma.Decimal(adjusted.toFixed(6)),
        commission,
        paymentMethod: dto.paymentMethod,
        phoneReceive: dto.phoneReceive,
        note: dto.note,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async listActive(filters: FilterOrdersDto) {
    const where: Prisma.OrderWhereInput = {
      status: filters.status ?? OrderStatus.ACTIVE,
    };
    if (filters.type) where.type = filters.type;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.currencyFrom) where.currencyFrom = filters.currencyFrom;
    if (filters.currencyTo) where.currencyTo = filters.currencyTo;

    const skip = filters.skip ?? 0;
    const take = Math.min(filters.take ?? 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, ratingAvg: true, kycStatus: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  async mine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { transaction: true },
    });
  }

  async getOne(id: number, userId?: number) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, ratingAvg: true } },
        transaction: true,
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }

  async updateOwn(userId: number, id: number, data: UpdateOrderDto) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o || o.userId !== userId) throw new ForbiddenException();
    if (o.status !== OrderStatus.ACTIVE) throw new BadRequestException('Order not editable');

    const update: Prisma.OrderUpdateInput = {};
    if (data.phoneReceive) update.phoneReceive = data.phoneReceive;
    if (data.note !== undefined) update.note = data.note;
    if (data.paymentMethod) update.paymentMethod = data.paymentMethod;
    if (data.expiresAt) update.expiresAt = new Date(data.expiresAt);

    return this.prisma.order.update({ where: { id }, data: update });
  }

  async cancelOwn(userId: number, id: number) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o || o.userId !== userId) throw new ForbiddenException();
    if (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.MATCHED) {
      throw new BadRequestException('Cannot cancel');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}
