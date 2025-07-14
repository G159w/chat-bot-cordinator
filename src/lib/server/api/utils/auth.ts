import { inject, injectable } from '@needle-di/core';
import { Elysia } from 'elysia';

import { Logger } from '../logger';
import { UserRepository } from '../user/user.repository';
import { Unauthorized } from './exceptions';

@injectable()
export class AuthGuard {
	constructor(
		private readonly userRepository = inject(UserRepository),
		private readonly logger = inject(Logger)
	) {
		this.useGuard = this.useGuard.bind(this);
	}

	useGuard() {
		return new Elysia({
			name: 'authGuard'
		}).derive({ as: 'global' }, async ({ headers }) => {
			if (!headers.authorization) {
				throw Unauthorized();
			}
			const token = headers.authorization.split(' ')[1];
			if (!token) {
				throw Unauthorized();
			}
			const user = await this.userRepository.findUserBySessionToken(token);
			if (!user) {
				throw Unauthorized();
			}
			this.logger.withContext({ userId: user.id });
			return { user };
		});
	}
}
