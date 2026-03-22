import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
  ) {}

  async open(transactionId: number, userId: number, dto: CreateDisputeDto) {
    const t = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new NotFoundException();
    if (t.senderId !== userId && t.receiverId !== userId) throw new ForbiddenException();
    if (t.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Invalid transaction');
    }
    const existing = await this.prisma.dispute.findUnique({ where: { transactionId } });
    if (existing) throw new BadRequestException('Dispute already open');

    const d = await this.prisma.$transaction(async (db) => {
      const dispute = await db.dispute.create({
        data: {
          transactionId,
          openedBy: userId,
          reason: dto.reason,
          description: dto.description,
        },
      });
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.DISPUTED },
      });
      return dispute;
    });
    return d;
  }

  async getOne(id: number, userId: number, isAdmin: boolean) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: true,
        attachments: true,
        opener: { select: { id: true, name: true } },
      },
    });
    if (!d) throw new NotFoundException();
    const t = d.transaction;
    if (!isAdmin && t.senderId !== userId && t.receiverId !== userId && d.openedBy !== userId) {
      throw new ForbiddenException();
    }
    return d;
  }

  async respond(id: number, userId: number, message: string) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!d) throw new NotFoundException();
    const t = d.transaction;
    if (t.senderId !== userId && t.receiverId !== userId) throw new ForbiddenException();
    if (d.status !== DisputeStatus.OPEN) throw new BadRequestException();
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.RESPONDED,
        resolution: message,
      },
    });
  }

  async addAttachment(id: number, userId: number, file: Express.Multer.File) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!d) throw new NotFoundException();
    const t = d.transaction;
    if (t.senderId !== userId && t.receiverId !== userId) throw new ForbiddenException();
    const url = this.upload.saveFile(file, 'disputes');
    return this.prisma.disputeAttachment.create({
      data: { disputeId: id, userId, fileUrl: url },
    });
  }

  async listAdmin(status?: DisputeStatus) {
    return this.prisma.dispute.findMany({
      where: status ? { status } : { status: DisputeStatus.OPEN },
      include: { transaction: true, opener: { select: { id: true, email: true, name: true } } },
    });
  }

  async resolve(adminId: number, id: number, resolution: string) {
    const d = await this.prisma.dispute.findUnique({ where: { id } });
    if (!d) throw new NotFoundException();
    return this.prisma.$transaction(async (db) => {
      await db.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          adminId,
          resolution,
          resolvedAt: new Date(),
        },
      });
      await db.transaction.update({
        where: { id: d.transactionId },
        data: { status: TransactionStatus.COMPLETED },
      });
      return { resolved: true };
    });
  }
}
