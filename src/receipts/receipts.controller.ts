import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

const RECEIPT_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

@ApiTags('Receipts')
@Controller('public/receipts')
export class ReceiptsController {
  constructor(private readonly config: ConfigService) {}

  private assertSafeFilename(filename: string) {
    const base = path.basename(filename);
    if (base !== filename || !RECEIPT_FILENAME.test(base)) {
      throw new BadRequestException('Invalid receipt filename');
    }
    return base;
  }

  private resolveReceiptPath(filename: string) {
    const baseDir = this.config.get<string>('upload.dest') ?? './uploads';
    const receiptsDir = path.resolve(baseDir, 'receipts');
    const full = path.resolve(receiptsDir, filename);
    if (!full.startsWith(receiptsDir + path.sep) && full !== receiptsDir) {
      throw new BadRequestException('Invalid path');
    }
    return full;
  }

  @Public()
  @Get(':filename')
  @ApiOperation({
    summary:
      'Télécharger un reçu PDF (public) — utilisé pour envoyer un média WhatsApp (NotifML)',
  })
  @ApiParam({
    name: 'filename',
    example: '3d87bc0c-552f-4e02-8267-4c740c07efe6.pdf',
  })
  @Header('Cache-Control', 'public, max-age=86400')
  async getReceipt(@Param('filename') filename: string): Promise<StreamableFile> {
    const safe = this.assertSafeFilename(filename);
    const fullPath = this.resolveReceiptPath(safe);
    if (!fs.existsSync(fullPath)) throw new NotFoundException();
    const stream = fs.createReadStream(fullPath);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `inline; filename="${encodeURIComponent(safe)}"`,
    });
  }
}

