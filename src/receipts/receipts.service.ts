import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import QRCode from 'qrcode';
import { formatCFA, formatRUB } from '../common/utils/format-money';
import { PrismaService } from '../prisma/prisma.service';

type ReceiptInput = {
  transactionId: number;
  createdAt: Date;
  completedAt?: Date | null;
  clientName: string;
  directionLabel: string;
  amountSentLabel: string;
  amountReceivedLabel: string;
  commissionLabel: string;
};

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private formatDateFr(d: Date): string {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return d.toISOString();
    }
  }

  private logoSvg(): string | null {
    try {
      const p = path.resolve(__dirname, 'assets', 'logo.svg');
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, 'utf8');
      // On retire le wordmark <text> du SVG pour éviter les soucis de rendu/typos dans PDFKit.
      // On garde l'icône, et le texte "DoniSend" est écrit en PDF (police standard).
      return raw.replace(/<text[\s\S]*?<\/text>\s*/gi, '');
    } catch {
      return null;
    }
  }

  private normalizePdfCurrencyGlyphs(label: string): string {
    // La police PDF par défaut peut ne pas supporter "₽" → affichage buggé (ex: "½").
    // On remplace par "RUB" pour un rendu fiable.
    return (label ?? '').replace(/₽/g, 'RUB');
  }

  private normalizeDirection(label: string): string {
    const s = (label ?? '').toUpperCase();
    const hasCfa = s.includes('CFA') || s.includes('XOF');
    const hasRub = s.includes('RUB');
    if (hasCfa && hasRub) {
      // Evite "→" si certaines polices le rendent mal
      const cfaIdx = s.indexOf('CFA') >= 0 ? s.indexOf('CFA') : s.indexOf('XOF');
      const rubIdx = s.indexOf('RUB');
      return cfaIdx >= 0 && rubIdx >= 0 && cfaIdx < rubIdx ? 'CFA -> RUB' : 'RUB -> CFA';
    }
    return label;
  }

  private base64UrlEncode(input: string): string {
    return Buffer.from(input, 'utf8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(input: string): string {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    const s = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(s, 'base64').toString('utf8');
  }

  private receiptVerifySecret(): string {
    return this.config.get<string>('receipts.verifySecret') ?? '';
  }

  private signVerifyToken(payload: Record<string, unknown>): string {
    const secret = this.receiptVerifySecret();
    if (!secret) throw new Error('Missing RECEIPT_VERIFY_SECRET');
    const body = this.base64UrlEncode(JSON.stringify(payload));
    const sig = createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verifyToken(token: string): { valid: boolean; payload?: any } {
    const raw = (token ?? '').trim();
    const [body, sig] = raw.split('.');
    if (!body || !sig) return { valid: false };
    const secret = this.receiptVerifySecret();
    if (!secret) return { valid: false };
    const expected = createHmac('sha256', secret).update(body).digest('base64url');
    if (expected !== sig) return { valid: false };
    try {
      const payload = JSON.parse(this.base64UrlDecode(body));
      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  }

  async verifyReceiptAuthenticity(token: string): Promise<
    | { valid: false }
    | {
        valid: true;
        transactionId: number;
        receiptFilename: string;
        completedAt: Date;
      }
  > {
    const v = this.verifyToken(token);
    if (!v.valid || !v.payload) return { valid: false };

    const transactionId = Number(v.payload.transactionId);
    const receiptFilename = String(v.payload.receiptFilename ?? '');
    if (!Number.isFinite(transactionId) || transactionId <= 0) return { valid: false };
    if (!/^[0-9a-f-]{36}\.pdf$/i.test(receiptFilename)) return { valid: false };

    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, completedAt: true },
    });
    if (!tx || tx.status !== 'COMPLETED' || !tx.completedAt) return { valid: false };

    return { valid: true, transactionId, receiptFilename, completedAt: tx.completedAt };
  }

  private appUrl(): string {
    return this.config.get<string>('app.url') ?? 'https://swaptrust.com';
  }

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
    const issuedAt = new Date();

    // URL de vérification (front) embarquée dans QR
    const verifyToken = this.signVerifyToken({
      v: 1,
      transactionId: input.transactionId,
      receiptFilename: filename,
      issuedAt: issuedAt.toISOString(),
    });
    const verifyUrl = `${this.appUrl().replace(/\/$/, '')}/receipt/verify?token=${encodeURIComponent(verifyToken)}`;
    const qrPng = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 6,
      color: { dark: '#0B1220', light: '#ffffff' },
    });

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

        // Palette (inspirée du logo)
        const ink = '#0B1220';
        const slate = '#64748b';
        const border = '#e2e8f0';
        const bg = '#f8fafc';
        const accent = '#2ECC71';
        const navy = '#1F3A5F';

        // Background
        doc.save();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(bg);
        doc.restore();

        // Header card
        const pagePad = 48;
        const headerH = 92;
        doc.save();
        doc.roundedRect(pagePad, 32, doc.page.width - pagePad * 2, headerH, 16).fill('#ffffff');
        doc.roundedRect(pagePad, 32, doc.page.width - pagePad * 2, headerH, 16).lineWidth(1).stroke(border);
        // left accent strip
        doc.roundedRect(pagePad, 32, 10, headerH, 16).fill(navy);
        doc.restore();

        // Logo (SVG)
        const svg = this.logoSvg();
        if (svg) {
          // viewBox 520x140 → scale down
          SVGtoPDF(doc as unknown as PDFKit.PDFDocument, svg, pagePad + 20, 46, {
            width: 170,
            preserveAspectRatio: 'xMinYMin meet',
          });
        } else {
          doc.fillColor(ink).font('Helvetica-Bold').fontSize(18).text('DoniSend', pagePad + 24, 60);
        }

        doc
          .fillColor(ink)
          .font('Helvetica-Bold')
          .fontSize(14)
          .text('Reçu de transfert', pagePad + 220, 52, {
            width: doc.page.width - pagePad - (pagePad + 220),
            lineBreak: false,
            ellipsis: true,
          });

        doc
          .fillColor(slate)
          .font('Helvetica')
          .fontSize(10)
          .text(`Transaction #${input.transactionId}`, pagePad + 220, 72, {
            width: doc.page.width - pagePad - (pagePad + 220),
            lineBreak: false,
            ellipsis: true,
          });

        const completedLabel = input.completedAt ? input.completedAt : input.createdAt;
        doc
          .fillColor(slate)
          .font('Helvetica')
          .fontSize(10)
          .text(`Date: ${this.formatDateFr(completedLabel)}`, pagePad + 220, 88, {
            width: doc.page.width - pagePad - (pagePad + 220),
            lineBreak: false,
            ellipsis: true,
          });

        // Main summary card
        const cardX = pagePad;
        const cardY = 148;
        const cardW = doc.page.width - pagePad * 2;
        const cardH = 330;
        doc.save();
        doc.roundedRect(cardX, cardY, cardW, cardH, 18).fill('#ffffff');
        doc.roundedRect(cardX, cardY, cardW, cardH, 18).lineWidth(1).stroke(border);
        doc.restore();

        const left = cardX + 24;
        const right = cardX + cardW - 24;
        let y = cardY + 20;

        // Badges row
        const badge = (text: string, x: number, y0: number, color: string) => {
          doc.font('Helvetica-Bold').fontSize(9);
          const w = doc.widthOfString(text) + 18;
          doc.save();
          doc.roundedRect(x, y0, w, 18, 9).fill(color);
          doc.restore();
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(text, x + 9, y0 + 5);
          return w + 8;
        };
        let bx = left;
        bx += badge('DoniSend', bx, y, navy);
        bx += badge('Reçu', bx, y, accent);
        y += 34;

        // Amounts (big)
        const sent = this.normalizePdfCurrencyGlyphs(input.amountSentLabel);
        const received = this.normalizePdfCurrencyGlyphs(input.amountReceivedLabel);
        doc.fillColor(slate).font('Helvetica').fontSize(10).text('Envoyé', left, y);
        doc
          .fillColor(ink)
          .font('Helvetica-Bold')
          .fontSize(22)
          .text(sent, left, y + 12, {
            width: cardW - 48,
            lineBreak: false,
            ellipsis: true,
          });
        y += 52;
        doc.fillColor(slate).font('Helvetica').fontSize(10).text('Reçu', left, y);
        doc
          .fillColor(accent)
          .font('Helvetica-Bold')
          .fontSize(22)
          .text(received, left, y + 12, {
            width: cardW - 48,
            lineBreak: false,
            ellipsis: true,
          });
        y += 58;

        // Divider
        doc.save();
        doc.moveTo(left, y).lineTo(right, y).lineWidth(1).stroke(border);
        doc.restore();
        y += 16;

        // Details mini-card (cleaner layout than plain rows)
        const detailsX = left;
        const detailsY = y;
        const detailsW = cardW - 48;
        const detailsH = 98;
        doc.save();
        doc.roundedRect(detailsX, detailsY, detailsW, detailsH, 14).fill('#f8fafc');
        doc.roundedRect(detailsX, detailsY, detailsW, detailsH, 14).lineWidth(1).stroke('#eef2f7');
        doc.restore();

        const colGap = 18;
        const colW = (detailsW - colGap) / 2;
        const labelStyle = () => doc.fillColor(slate).font('Helvetica').fontSize(9);
        const valueStyle = () => doc.fillColor(ink).font('Helvetica-Bold').fontSize(11);

        const cell = (x: number, y0: number, label: string, value: string) => {
          labelStyle().text(label, x, y0);
          valueStyle().text(value, x, y0 + 12, {
            width: colW,
            lineBreak: false,
            ellipsis: true,
          });
        };

        const dir = this.normalizeDirection(input.directionLabel);
        const commission = this.normalizePdfCurrencyGlyphs(input.commissionLabel);

        cell(detailsX + 14, detailsY + 14, 'Client', input.clientName);
        cell(detailsX + 14 + colW + colGap, detailsY + 14, 'Opérateur', 'DoniSend');
        cell(detailsX + 14, detailsY + 56, 'Sens', dir);
        cell(detailsX + 14 + colW + colGap, detailsY + 56, 'Commission', commission);

        y += detailsH + 14;

        // Footer
        // IMPORTANT: PDFKit respecte la marge en bas (page.height - margin).
        // Si on écrit trop près du bas, il crée une 2e page.
        const bottomMargin =
          (doc.page as unknown as { margins?: { bottom?: number } }).margins?.bottom ?? pagePad;
        // marge de sécurité pour éviter un saut de page PDFKit
        const footerY2 = doc.page.height - bottomMargin - 26;
        const footerY1 = footerY2 - 14;
        doc
          .fillColor(slate)
          .font('Helvetica')
          .fontSize(9)
          .text('Support: support@donisend.com', pagePad, footerY1, {
            lineBreak: false,
            ellipsis: true,
            width: doc.page.width - pagePad * 2,
          });
        doc
          .fillColor(slate)
          .font('Helvetica')
          .fontSize(9)
          .text('© DoniSend', pagePad, footerY2, {
            lineBreak: false,
            ellipsis: true,
            width: doc.page.width - pagePad * 2,
          });

        // QR code (authenticité)
        const qrSize = 86;
        const qrX = right - qrSize;
        const qrY = footerY1 - qrSize - 4;
        doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });
        doc
          .fillColor(slate)
          .font('Helvetica')
          .fontSize(8)
          .text('Vérifier le reçu', qrX - 2, qrY + qrSize + 2, {
            width: qrSize + 4,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });

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

