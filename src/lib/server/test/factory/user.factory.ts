import { faker } from '@faker-js/faker';

import * as schema from '../../db/schema';
import { TestDbService } from '../mock.service';

export interface CreateUserData {
	email?: string;
	emailVerified?: Date;
	id?: string;
	image?: string;
	name?: string;
}

export type Session = typeof schema.sessionTable.$inferSelect;
export type User = typeof schema.userTable.$inferSelect;

export interface UserWithToken {
	createdUser: User;
	userToken: string;
}

export class UserFactory {
	private dbService: TestDbService;

	constructor(dbService: TestDbService) {
		this.dbService = dbService;
	}

	/**
	 * Creates an analyst user with session token
	 */
	async createAnalystUser(overrides: Partial<CreateUserData> = {}): Promise<UserWithToken> {
		const userData = this.createAnalystUserData(overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates a basic user with minimal required data and session token
	 */
	async createBasicUser(overrides: Partial<CreateUserData> = {}): Promise<UserWithToken> {
		const userData = this.createBasicUserData(overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates a user with custom data and session token
	 */
	async createCustomUser(
		name: string,
		overrides: Partial<CreateUserData> = {}
	): Promise<UserWithToken> {
		const userData = this.createCustomUserData(name, overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates multiple users for testing with session tokens
	 */
	async createMultipleUsers(
		count: number = 3,
		overrides: Partial<CreateUserData> = {}
	): Promise<UserWithToken[]> {
		const usersWithTokens: UserWithToken[] = [];

		for (let i = 0; i < count; i++) {
			const userData: CreateUserData = {
				email: faker.internet.email(),
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				...overrides
			};

			const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
			const user = result[0];
			const sessionToken = await this.createSessionToken(user.id);
			usersWithTokens.push({ createdUser: user, userToken: sessionToken });
		}

		return usersWithTokens;
	}

	/**
	 * Creates a researcher user with session token
	 */
	async createResearcherUser(overrides: Partial<CreateUserData> = {}): Promise<UserWithToken> {
		const userData = this.createResearcherUserData(overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates a test user for development with session token
	 */
	async createTestUser(overrides: Partial<CreateUserData> = {}): Promise<UserWithToken> {
		const userData = this.createTestUserData(overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates a writer user with session token
	 */
	async createWriterUser(overrides: Partial<CreateUserData> = {}): Promise<UserWithToken> {
		const userData = this.createWriterUserData(overrides);
		const result = await this.dbService.db.insert(schema.userTable).values(userData).returning();
		const user = result[0];
		const sessionToken = await this.createSessionToken(user.id);
		return { createdUser: user, userToken: sessionToken };
	}

	/**
	 * Creates analyst user data (without database operation)
	 */
	private createAnalystUserData(overrides: Partial<CreateUserData> = {}): CreateUserData {
		return {
			email: 'analyst@example.com',
			id: 'user-analyst', // Keep consistent for tests
			name: 'Analyst User',
			...overrides
		};
	}

	/**
	 * Creates basic user data (without database operation)
	 */
	private createBasicUserData(overrides: Partial<CreateUserData> = {}): CreateUserData {
		return {
			email: faker.internet.email(),
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			...overrides
		};
	}

	/**
	 * Creates custom user data (without database operation)
	 */
	private createCustomUserData(
		name: string,
		overrides: Partial<CreateUserData> = {}
	): CreateUserData {
		return {
			email: faker.internet.email(),
			id: faker.string.uuid(),
			name,
			...overrides
		};
	}

	/**
	 * Creates researcher user data (without database operation)
	 */
	private createResearcherUserData(overrides: Partial<CreateUserData> = {}): CreateUserData {
		return {
			email: 'researcher@example.com',
			id: 'user-researcher', // Keep consistent for tests
			name: 'Researcher User',
			...overrides
		};
	}

	/**
	 * Creates a session token for a user
	 */
	private async createSessionToken(userId: string): Promise<string> {
		const sessionToken = crypto.randomUUID();
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

		await this.dbService.db.insert(schema.sessionTable).values({
			expires,
			sessionToken,
			userId
		});

		return sessionToken;
	}

	/**
	 * Creates test user data (without database operation)
	 */
	private createTestUserData(overrides: Partial<CreateUserData> = {}): CreateUserData {
		return {
			email: 'testuser@example.com',
			id: 'user-123', // Keep consistent for tests
			name: 'Test User',
			...overrides
		};
	}

	/**
	 * Creates writer user data (without database operation)
	 */
	private createWriterUserData(overrides: Partial<CreateUserData> = {}): CreateUserData {
		return {
			email: 'writer@example.com',
			id: 'user-writer', // Keep consistent for tests
			name: 'Writer User',
			...overrides
		};
	}
}
