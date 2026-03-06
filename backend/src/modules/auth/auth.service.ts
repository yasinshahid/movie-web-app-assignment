import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { prisma } from '../../utils/prisma';
import { AppError } from '../../utils/errors';

function signAccessToken(userId: string) {
	if (!env.JWT_SECRET) {
		throw new AppError({
			statusCode: 500,
			code: 'INTERNAL_ERROR',
			message: 'JWT secret is not configured',
		});
	}

	return jwt.sign({}, env.JWT_SECRET, {
		subject: userId,
		expiresIn: '7d',
	});
}

function publicUser(user: { id: string; email: string; createdAt: Date }) {
	return {
		id: user.id,
		email: user.email,
		createdAt: user.createdAt.toISOString(),
	};
}

export async function register(input: { email: string; password: string }) {
	const email = input.email.trim().toLowerCase();
	const passwordHash = await bcrypt.hash(input.password, 10);

	try {
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
			},
			select: {
				id: true,
				email: true,
				createdAt: true,
			},
		});

		return { user: publicUser(user) };
	} catch (err: any) {
		// Prisma unique constraint
		if (err?.code === 'P2002') {
			throw new AppError({
				statusCode: 409,
				code: 'CONFLICT',
				message: 'Email already in use',
			});
		}

		throw err;
	}
}

export async function login(input: { email: string; password: string }) {
	const email = input.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			passwordHash: true,
			createdAt: true,
		},
	});

	if (!user) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Invalid credentials',
		});
	}

	const ok = await bcrypt.compare(input.password, user.passwordHash);
	if (!ok) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Invalid credentials',
		});
	}

	const accessToken = signAccessToken(user.id);

	return {
		accessToken,
		user: publicUser(user),
	};
}

export async function me(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			createdAt: true,
		},
	});

	if (!user) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	return { user: publicUser(user) };
}
