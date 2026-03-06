import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/errors';

type JwtPayload = {
	sub: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
	const header = req.header('authorization');
	if (!header || !header.toLowerCase().startsWith('bearer ')) {
		return next(
			new AppError({
				statusCode: 401,
				code: 'UNAUTHORIZED',
				message: 'Authentication required',
			}),
		);
	}

	if (!env.JWT_SECRET) {
		return next(
			new AppError({
				statusCode: 500,
				code: 'INTERNAL_ERROR',
				message: 'JWT secret is not configured',
			}),
		);
	}

	const token = header.slice('bearer '.length).trim();
	try {
		const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
		const userId = decoded?.sub;
		if (!userId) {
			throw new Error('Missing sub');
		}

		req.auth = { userId };
		return next();
	} catch {
		return next(
			new AppError({
				statusCode: 401,
				code: 'UNAUTHORIZED',
				message: 'Authentication required',
			}),
		);
	}
}
