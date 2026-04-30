import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type LegalDocKey = 'privacy' | 'terms' | 'disclaimer';

@Injectable()
export class LegalService {
  constructor(private readonly config: ConfigService) {}

  getDocMarkdown(key: LegalDocKey): string {
    const file = this.resolveDocPath(key);
    const raw = readFileSync(file, 'utf8');
    return this.interpolate(raw);
  }

  private resolveDocPath(key: LegalDocKey): string {
    const base = join(process.cwd(), 'docs', 'legal');
    switch (key) {
      case 'privacy':
        return join(base, 'politique-de-confidentialite.md');
      case 'terms':
        return join(base, 'conditions-generales-utilisation.md');
      case 'disclaimer':
        return join(base, 'disclaimer.md');
    }
  }

  private interpolate(input: string): string {
    const appName = this.config.get<string>('APP_NAME') ?? 'DoniSend';
    const legalEntityName =
      this.config.get<string>('LEGAL_ENTITY_NAME') ?? appName;
    const legalAddress = this.config.get<string>('LEGAL_ADDRESS') ?? '—';
    const legalContactEmail =
      this.config.get<string>('LEGAL_CONTACT_EMAIL') ??
      this.config.get<string>('SUPPORT_EMAIL') ??
      'support@example.com';
    const effectiveDate =
      this.config.get<string>('LEGAL_EFFECTIVE_DATE') ??
      new Date().toISOString().slice(0, 10);

    return input
      .replaceAll('{{APP_NAME}}', appName)
      .replaceAll('{{LEGAL_ENTITY_NAME}}', legalEntityName)
      .replaceAll('{{LEGAL_ADDRESS}}', legalAddress)
      .replaceAll('{{LEGAL_CONTACT_EMAIL}}', legalContactEmail)
      .replaceAll('{{EFFECTIVE_DATE}}', effectiveDate);
  }
}

