import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async verifyParticipant(transactionId: number, userId: number) {
    await this.assertParticipant(transactionId, userId);
  }

  private async assertParticipant(transactionId: number, userId: number) {
    const t = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new NotFoundException();
    if (t.clientId !== userId && t.operatorId !== userId) {
      throw new ForbiddenException();
    }
    return t;
  }

  async listMessages(transactionId: number, userId: number) {
    await this.assertParticipant(transactionId, userId);
    return this.prisma.message.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async saveMessage(
    transactionId: number,
    senderId: number,
    dto: SendMessageDto,
  ) {
    await this.assertParticipant(transactionId, senderId);
    return this.prisma.message.create({
      data: {
        transactionId,
        senderId,
        content: dto.content,
        type: dto.type ?? MessageType.TEXT,
        attachmentUrl: dto.attachmentUrl,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async markRead(transactionId: number, userId: number) {
    await this.assertParticipant(transactionId, userId);
    await this.prisma.message.updateMany({
      where: {
        transactionId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
    return { read: true };
  }
}
