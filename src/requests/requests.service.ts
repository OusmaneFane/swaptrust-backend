import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, RequestStatus, RequestType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RatesService } from '../rates/rates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { FilterRequestsDto } from './dto/filter-requests.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { formatCFA, formatRUB } from '../common/utils/format-money';

const PENDING_TTL_MS = 30 * 60 * 1000;
const PENDING_TTL_MIN = 30;

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rates: RatesService,
    private readonly notifications: NotificationsService,
    private readonly commissions: CommissionsService,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async create(dto: CreateRequestDto, clientId: number) {
    const { rate: googleRate } = await this.rates.getCurrentRateXofToRub();
    const amountWanted = BigInt(dto.amountWanted);
    const minXof = this.config.get<number>('limits.minAmountXof') ?? 500_000;
    const maxXof = this.config.get<number>('limits.maxAmountXof') ?? 50_000_000;

    let amountToSendBase: bigint;
    let currencyWanted: string;
    let currencyToSend: string;

    if (dto.type === RequestType.NEED_RUB) {
      currencyWanted = 'RUB';
      currencyToSend = 'XOF';
      amountToSendBase = BigInt(Math.round(Number(amountWanted) / googleRate));
      const netXof = Number(amountToSendBase);
      if (netXof < minXof || netXof > maxXof) {
        throw new BadRequestException(
          `Montant CFA hors limites (${minXof}–${maxXof} centimes, hors commission)`,
        );
      }
    } else {
      currencyWanted = 'XOF';
      currencyToSend = 'RUB';
      const wantedXof = Number(amountWanted);
      if (wantedXof < minXof || wantedXof > maxXof) {
        throw new BadRequestException(
          `Montant CFA hors limites (${minXof}–${maxXof} centimes)`,
        );
      }
      amountToSendBase = BigInt(Math.round(Number(amountWanted) * googleRate));
    }

    const sendCurrency = dto.type === RequestType.NEED_RUB ? 'XOF' : 'RUB';
    const breakdown = await this.commissions.calculate(
      Number(amountToSendBase),
      googleRate,
      sendCurrency,
    );
    const commission = BigInt(breakdown.commissionAmount);
    const amountToSendTotal = BigInt(breakdown.totalToSend);
    const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

    const request = await this.prisma.exchangeRequest.create({
      data: {
        clientId,
        type: dto.type,
        amountWanted,
        currencyWanted,
        amountToSend: amountToSendTotal,
        currencyToSend,
        rateAtRequest: new Prisma.Decimal(googleRate.toFixed(6)),
        commissionAmount: commission,
        paymentMethod: dto.paymentMethod,
        phoneToSend: dto.phoneToSend,
        note: dto.note,
        status: RequestStatus.PENDING,
        expiresAt,
      },
    });

    const label =
      dto.type === RequestType.NEED_RUB ? 'Besoin de roubles' : 'Besoin de CFA';
    await this.notifications.notifyOperators({
      type: 'NEW_REQUEST',
      title: 'Nouvelle demande client',
      body: `${label} — ${amountWanted.toString()} ${currencyWanted}`,
      data: { requestId: request.id },
    });

    // WhatsApp staff: alerte rapide pour tous les ADMIN + OPERATOR
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.OPERATOR] },
        isBanned: false,
      },
      select: { name: true, phoneMali: true, phoneRussia: true, countryResidence: true },
    });

    const amountToSendLabel =
      currencyToSend === 'XOF'
        ? formatCFA(Number(request.amountToSend))
        : formatRUB(Number(request.amountToSend));
    const amountReceiveLabel =
      currencyWanted === 'XOF'
        ? formatCFA(Number(request.amountWanted))
        : formatRUB(Number(request.amountWanted));

    const direction =
      dto.type === RequestType.NEED_RUB
        ? `${amountToSendLabel} → ${amountReceiveLabel}`
        : `${amountToSendLabel} → ${amountReceiveLabel}`;

    await Promise.all(
      staff.map((s) =>
        this.whatsapp
          .sendNewRequestStaffAlert({
            staff: {
              name: s.name,
              phone: clientWhatsappPhone(s),
            },
            requestId: request.id,
            label,
            direction,
            amountWanted: amountReceiveLabel,
            expiresInMin: PENDING_TTL_MIN,
          })
          .catch(() => {}),
      ),
    );

    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (user) {
      void this.whatsapp
        .sendRequestCreated({
          user: { name: user.name, phone: clientWhatsappPhone(user) },
          requestId: request.id,
          type: request.type as 'NEED_RUB' | 'NEED_CFA',
          amountToSend: amountToSendLabel,
          amountReceive: amountReceiveLabel,
          expiresInMin: PENDING_TTL_MIN,
        })
        .catch(() => {});
    }

    return request;
  }

  async mine(clientId: number) {
    return this.prisma.exchangeRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { transaction: true },
    });
  }

  async getOne(id: number, viewer?: { id: number; role: UserRole }) {
    const r = await this.prisma.exchangeRequest.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, ratingAvg: true } },
        transaction: true,
      },
    });
    if (!r) throw new NotFoundException();
    if (viewer && viewer.role === UserRole.CLIENT && r.clientId !== viewer.id) {
      throw new ForbiddenException();
    }
    return r;
  }

  async cancelOwn(clientId: number, id: number) {
    const r = await this.prisma.exchangeRequest.findUnique({ where: { id } });
    if (!r || r.clientId !== clientId) throw new ForbiddenException();
    if (r.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être annulées',
      );
    }
    return this.prisma.exchangeRequest.update({
      where: { id },
      data: { status: RequestStatus.CANCELLED },
    });
  }

  async listPendingForOperator(filters: FilterRequestsDto) {
    const skip = filters.skip ?? 0;
    const take = Math.min(filters.take ?? 50, 100);
    const where: Prisma.ExchangeRequestWhereInput = {
      status: RequestStatus.PENDING,
      expiresAt: { gt: new Date() },
    };
    if (filters.type) where.type = filters.type;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

    return this.prisma.exchangeRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneMali: true,
            phoneRussia: true,
            kycStatus: true,
            ratingAvg: true,
          },
        },
      },
    });
  }

  async expirePendingRequests(): Promise<number> {
    const toExpire = await this.prisma.exchangeRequest.findMany({
      where: {
        status: RequestStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      include: {
        client: { select: { name: true, phoneMali: true, phoneRussia: true } },
      },
    });
    if (toExpire.length === 0) return 0;

    await this.prisma.exchangeRequest.updateMany({
      where: { id: { in: toExpire.map((r) => r.id) } },
      data: { status: RequestStatus.EXPIRED },
    });

    for (const row of toExpire) {
      await this.notifications.notify(row.clientId, {
        type: 'REQUEST_EXPIRED',
        title: 'Demande expirée',
        body: 'Aucun opérateur n’a pris en charge votre demande à temps. Vous pouvez en créer une nouvelle.',
        data: { requestId: row.id },
      });
      void this.whatsapp
        .sendRequestExpired({
          user: {
            name: row.client.name,
            phone: clientWhatsappPhone(row.client),
          },
          requestId: row.id,
        })
        .catch(() => {});
    }
    return toExpire.length;
  }

  async alertSoonExpiringRequests(): Promise<void> {
    const now = Date.now();
    const soon = await this.prisma.exchangeRequest.findMany({
      where: {
        status: RequestStatus.PENDING,
        expiresAt: {
          lte: new Date(now + 10 * 60 * 1000),
          gt: new Date(now),
        },
      },
    });
    for (const request of soon) {
      await this.notifications.notifyOperators({
        type: 'REQUEST_EXPIRING_SOON',
        title: 'Demande bientôt expirée',
        body: `La demande #${request.id} expire dans moins de 10 minutes.`,
        data: { requestId: request.id },
      });
    }
  }
}
