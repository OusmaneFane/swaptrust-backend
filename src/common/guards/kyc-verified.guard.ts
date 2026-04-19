import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class KycVerifiedGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
