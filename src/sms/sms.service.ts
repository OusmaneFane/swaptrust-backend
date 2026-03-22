import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: ReturnType<typeof Twilio> | null = null;

  constructor(private config: ConfigService) {
    const sid = this.config.get<string>('twilio.accountSid');
    const token = this.config.get<string>('twilio.authToken');
    if (sid && token) {
      this.client = Twilio(sid, token);
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const from = this.config.get<string>('twilio.phoneNumber');
    const body = `SwapTrust code: ${code}`;
    if (this.client && from) {
      await this.client.messages.create({ to: phone, from, body });
      return;
    }
    this.logger.log(`[DEV SMS] ${phone} → ${body}`);
  }
}
