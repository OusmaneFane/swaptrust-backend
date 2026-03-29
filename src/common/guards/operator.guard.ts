import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class OperatorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: Express.User }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Non authentifié');
    if (user.role !== UserRole.OPERATOR && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès réservé aux opérateurs et admins');
    }
    return true;
  }
}
