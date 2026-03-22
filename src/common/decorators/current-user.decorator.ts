import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof Express.User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Express.User }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
