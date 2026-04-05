import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async submit(
    userId: number,
    docType: string,
    files: { front: Express.Multer.File; back: Express.Multer.File; selfie: Express.Multer.File },
  ) {
    if (!files.front || !files.back || !files.selfie) {
      throw new BadRequestException('front, back, selfie required');
    }
    const frontUrl = this.upload.saveFile(files.front, 'kyc');
    const backUrl = this.upload.saveFile(files.back, 'kyc');
    const selfieUrl = this.upload.saveFile(files.selfie, 'kyc');

    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KycStatus.PENDING },
    });

    const doc = await this.prisma.kycDocument.upsert({
      where: { userId },
      create: {
        userId,
        docType,
        frontUrl,
        backUrl,
        selfieUrl,
        status: KycStatus.PENDING,
      },
      update: {
        docType,
        frontUrl,
        backUrl,
        selfieUrl,
        status: KycStatus.PENDING,
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (user) {
      void this.whatsapp
        .sendKycSubmitted({
          name: user.name,
          phone: clientWhatsappPhone(user),
        })
        .catch(() => {});
    }

    return doc;
  }

  async status(userId: number) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { userId } });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });
    return { kycStatus: user?.kycStatus, document: doc };
  }

  async approve(adminId: number, docUserId: number) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { userId: docUserId } });
    if (!doc) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.kycDocument.update({
        where: { userId: docUserId },
        data: {
          status: KycStatus.VERIFIED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: docUserId },
        data: { kycStatus: KycStatus.VERIFIED },
      }),
    ]);
    const user = await this.prisma.user.findUnique({
      where: { id: docUserId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (user) {
      void this.whatsapp
        .sendKycApproved({ name: user.name, phone: clientWhatsappPhone(user) })
        .catch(() => {});
    }
    return { approved: true };
  }

  async reject(adminId: number, docUserId: number, note: string) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { userId: docUserId } });
    if (!doc) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.kycDocument.update({
        where: { userId: docUserId },
        data: {
          status: KycStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: note,
        },
      }),
      this.prisma.user.update({
        where: { id: docUserId },
        data: { kycStatus: KycStatus.REJECTED },
      }),
    ]);
    const user = await this.prisma.user.findUnique({
      where: { id: docUserId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (user) {
      void this.whatsapp
        .sendKycRejected(
          { name: user.name, phone: clientWhatsappPhone(user) },
          note,
        )
        .catch(() => {});
    }
    return { rejected: true };
  }

  async pendingList() {
    return this.prisma.kycDocument.findMany({
      where: { status: KycStatus.PENDING },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
}
