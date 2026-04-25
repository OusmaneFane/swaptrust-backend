import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { formatCFA, formatRUB } from '../common/utils/format-money';

type ReceiptInput = {
  transactionId: number;
  createdAt: Date;
  completedAt?: Date | null;
  clientName: string;
  operatorName?: string | null;
  directionLabel: string;
  amountSentLabel: string;
  amountReceivedLabel: string;
  commissionLabel: string;
  rateLabel: string;
};

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(private readonly config: ConfigService) {}

  private uploadsBaseDir(): string {
    return this.config.get<string>('upload.dest') ?? './uploads';
  }

  private ensureReceiptsDir(): string {
    const dir = path.resolve(this.uploadsBaseDir(), 'receipts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private apiPublicUrl(): string {
    const raw =
      this.config.get<string>('api.publicUrl') ??
      this.config.get<string>('apiPublicUrl') ??
      'http://localhost:3001';
    return raw.replace(/\/$/, '');
  }

  /**
   * Génère un PDF "reçu" et retourne une URL publique téléchargeable.
   * Important: l'URL est publique (pour que NotifML/WhatsApp puisse la récupérer).
   */
  async generateTransferReceiptPdf(input: ReceiptInput): Promise<{
    filename: string;
    publicUrl: string;
    relativePath: string;
  }> {
    const dir = this.ensureReceiptsDir();
    const filename = `${randomUUID()}.pdf`;
    const fullPath = path.join(dir, filename);

    await new Promise<void>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 48,
          info: {
            Title: `Reçu DoniSend — Transaction #${input.transactionId}`,
            Author: 'DoniSend',
          },
        });

        const out = fs.createWriteStream(fullPath);
        out.on('finish', () => resolve());
        out.on('error', reject);
        doc.on('error', reject);

        doc.pipe(out);

        // Palette
        const brand = '#0ea5e9'; // sky-500
        const dark = '#0f172a'; // slate-900
        const muted = '#64748b'; // slate-500
        const bg = '#f8fafc'; // slate-50

        // Header background band
        doc.save();
        doc.rect(0, 0, doc.page.width, 120).fill(bg);
        doc.rect(0, 0, doc.page.width, 6).fill(brand);
        doc.restore();

        // Brand (text "logo")
        doc
          .fillColor(dark)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('DoniSend', 48, 32, { continued: true })
          .fillColor(brand)
          .text(' • ', { continued: true })
          .fillColor(dark)
          .text('Reçu de transfert');

        doc
          .fillColor(muted)
          .fontSize(10)
          .font('Helvetica')
          .text(`Transaction #${input.transactionId}`, 48, 64);

        const completedLabel = input.completedAt
          ? input.completedAt.toISOString()
          : input.createdAt.toISOString();
        doc
          .fillColor(muted)
          .fontSize(10)
          .text(`Généré le: ${completedLabel}`, 48, 80);

        // Card
        const cardX = 48;
        const cardY = 140;
        const cardW = doc.page.width - 96;
        const cardH = 360;
        doc.save();
        doc.roundedRect(cardX, cardY, cardW, cardH, 14).fill('#ffffff');
        doc.roundedRect(cardX, cardY, cardW, cardH, 14).lineWidth(1).stroke('#e2e8f0');
        doc.restore();

        const left = cardX + 24;
        let y = cardY + 22;

        doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text('Détails', left, y);
        y += 18;
        doc.fillColor('#e2e8f0').rect(left, y, cardW - 48, 1).fill();
        y += 14;

        const row = (label: string, value: string) => {
          doc.fillColor(muted).font('Helvetica').fontSize(10).text(label, left, y);
          doc
            .fillColor(dark)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(value, left + 170, y, { width: cardW - 48 - 170, align: 'right' });
          y += 18;
        };

        row('Client', input.clientName);
        row('Opérateur', input.operatorName ?? '—');
        row('Sens', input.directionLabel);

        y += 4;
        doc.fillColor('#e2e8f0').rect(left, y, cardW - 48, 1).fill();
        y += 14;

        // Amount block (bigger)
        doc.fillColor(muted).font('Helvetica').fontSize(10).text('Envoyé', left, y);
        doc
          .fillColor(dark)
          .font('Helvetica-Bold')
          .fontSize(16)
          .text(input.amountSentLabel, left, y - 4, {
            width: cardW - 48,
            align: 'right',
          });
        y += 26;

        doc.fillColor(muted).font('Helvetica').fontSize(10).text('Reçu', left, y);
        doc
          .fillColor(brand)
          .font('Helvetica-Bold')
          .fontSize(16)
          .text(input.amountReceivedLabel, left, y - 4, {
            width: cardW - 48,
            align: 'right',
          });
        y += 28;

        y += 4;
        doc.fillColor('#e2e8f0').rect(left, y, cardW - 48, 1).fill();
        y += 14;

        row('Taux', input.rateLabel);
        row('Commission', input.commissionLabel);

        y += 8;
        doc
          .fillColor(muted)
          .font('Helvetica')
          .fontSize(9)
          .text(
            "Ce reçu confirme la clôture de l'échange. Conservez-le pour vos archives.",
            left,
            y,
            { width: cardW - 48 },
          );

        // Footer
        doc
          .fillColor(muted)
          .fontSize(9)
          .text('Support: support@donisend.com', 48, doc.page.height - 80);
        doc
          .fillColor(muted)
          .fontSize(9)
          .text('© DoniSend', 48, doc.page.height - 64);

        doc.end();
      } catch (e) {
        reject(e);
      }
    }).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Receipt PDF generation failed: ${msg}`);
      throw e;
    });

    const relativePath = `receipts/${filename}`;
    const publicUrl = `${this.apiPublicUrl()}/api/v1/public/receipts/${encodeURIComponent(filename)}`;
    return { filename, publicUrl, relativePath };
  }

  /**
   * Helpers: formats (optionnellement utilisé par les callers).
   */
  formatLabels(params: { sent: bigint; received: bigint; isNeedRub: boolean }) {
    const sent = params.isNeedRub ? formatCFA(Number(params.sent)) : formatRUB(Number(params.sent));
    const received = params.isNeedRub
      ? formatRUB(Number(params.received))
      : formatCFA(Number(params.received));
    return { sent, received };
  }
}

