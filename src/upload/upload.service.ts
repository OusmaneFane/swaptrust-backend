import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {}

  ensureDir() {
    const dest = this.config.get<string>('upload.dest') ?? './uploads';
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    return dest;
  }

  validateFile(mimetype: string, size: number) {
    const max = this.config.get<number>('upload.maxFileSize') ?? 5_242_880;
    if (size > max) throw new Error('File too large');
    if (!ALLOWED_MIME.has(mimetype)) throw new Error('Invalid file type');
  }

  saveFile(file: Express.Multer.File, subdir: string): string {
    this.validateFile(file.mimetype, file.size);
    const base = this.ensureDir();
    const dir = path.join(base, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${randomUUID()}${ext}`;
    const full = path.join(dir, name);
    fs.writeFileSync(full, file.buffer);
    return path.join(subdir, name).replace(/\\/g, '/');
  }
}
