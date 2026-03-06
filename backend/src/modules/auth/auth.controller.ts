import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/errors';
import * as authService from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body as { email: string; password: string };
	const result = await authService.register({ email, password });
	res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body as { email: string; password: string };
	const result = await authService.login({ email, password });
	res.status(200).json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const result = await authService.me(userId);
	res.status(200).json(result);
});
