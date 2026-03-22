import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: Express.User }>().user;
    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
