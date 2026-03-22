import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { KycStatus } from '@prisma/client';

@Injectable()
export class KycVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: Express.User }>();
    const user = req.user;
    if (!user || user.kycStatus !== KycStatus.VERIFIED) {
      throw new ForbiddenException('KYC verification required');
    }
    return true;
  }
}
