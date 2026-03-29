import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: Express.User }>().user;
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return true;
  }
}
