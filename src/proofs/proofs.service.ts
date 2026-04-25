import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Nom de fichier généré par UploadService (UUID + extension). */
const PROOF_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|pdf)$/i;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

@Injectable()
export class ProofsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private assertSafeFilename(filename: string) {
    const base = path.basename(filename);
    if (base !== filename || !PROOF_FILENAME.test(base)) {
      throw new BadRequestException('Invalid proof filename');
    }
    return base;
  }

  private resolveProofPath(filename: string) {
    const base = this.config.get<string>('upload.dest') ?? './uploads';
    const proofsDir = path.resolve(base, 'proofs');
    const full = path.resolve(proofsDir, filename);
    if (!full.startsWith(proofsDir + path.sep) && full !== proofsDir) {
      throw new BadRequestException('Invalid path');
    }
    return full;
  }

  async assertCanViewProof(user: Express.User, filename: string) {
    const safeName = this.assertSafeFilename(filename);
    const rel = `proofs/${safeName}`;

    const t = await this.prisma.transaction.findFirst({
      where: {
        OR: [
          { clientProofUrl: rel },
          { operatorProofUrl: rel },
          { platformToOperatorProofUrl: rel },
        ],
      },
      select: {
        id: true,
        clientId: true,
        operatorId: true,
        clientProofUrl: true,
        operatorProofUrl: true,
        platformToOperatorProofUrl: true,
      },
    });
    if (!t) throw new NotFoundException();

    const isAdmin = user.role === UserRole.ADMIN;
    const isAssignedOperator =
      user.role === UserRole.OPERATOR && t.operatorId === user.id;
    const isClient = t.clientId === user.id;

    // Preuve interne "plateforme → opérateur" : visible uniquement pour admin et opérateur assigné
    if (t.platformToOperatorProofUrl === rel) {
      if (!isAdmin && !isAssignedOperator) throw new ForbiddenException();
    } else {
      if (!isAdmin && !isAssignedOperator && !isClient) throw new ForbiddenException();
    }

    return { fullPath: this.resolveProofPath(safeName), ext: path.extname(safeName).toLowerCase() };
  }

  getFileStream(fullPath: string) {
    if (!fs.existsSync(fullPath)) throw new NotFoundException();
    return fs.createReadStream(fullPath);
  }

  contentTypeForExt(ext: string) {
    return MIME[ext] ?? 'application/octet-stream';
  }
}
