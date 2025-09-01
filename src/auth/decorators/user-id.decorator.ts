import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator((_d, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const u = req.user || {};

  return u.sub ?? u.userId ?? u._id ?? u.id ?? null;
});