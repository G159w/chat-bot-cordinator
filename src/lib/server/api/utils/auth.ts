import { Logger } from '$server/api/logger';
import { UserRepository } from '$server/api/user/user.repository';
import { Unauthorized } from '$server/api/utils/exceptions';
import { inject, injectable } from '@needle-di/core';
import { Elysia } from 'elysia';

@injectable()
export class AuthGuard {
  constructor(
    private readonly userRepository = inject(UserRepository),
    private readonly logger = inject(Logger)
  ) {
    this.useGuard = this.useGuard.bind(this);
  }

  useGuard() {
    const userRepository = this.userRepository;
    const logger = this.logger;

    return new Elysia({
      name: 'authGuard'
    }).derive({ as: 'global' }, async function authGuard({ headers }) {
      if (!headers.authorization) {
        throw Unauthorized();
      }
      const token = headers.authorization.split(' ')[1];
      if (!token) {
        throw Unauthorized();
      }
      const user = await userRepository.findUserBySessionToken(token);
      if (!user) {
        throw Unauthorized();
      }
      logger.withContext({ userId: user.id });
      return { user };
    });
  }
}
