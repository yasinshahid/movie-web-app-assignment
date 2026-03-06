import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError, toFieldErrors } from '../utils/errors';

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	if (err instanceof ZodError) {
		return res.status(400).json({
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Invalid request',
				fields: toFieldErrors(err),
			},
		});
	}

	if (
		err instanceof SyntaxError &&
		// body-parser/express.json sets these on invalid JSON
		(typeof (err as any).status === 'number' ? (err as any).status === 400 : true)
	) {
		return res.status(400).json({
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Invalid JSON body',
				fields: [],
			},
		});
	}

	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			error: {
				code: err.code,
				message: err.message,
				...(err.details ? { details: err.details } : {}),
			},
		});
	}

	return res.status(500).json({
		error: {
			code: 'INTERNAL_ERROR',
			message: 'Internal server error',
			...(process.env.NODE_ENV !== 'production' && err instanceof Error
				? { details: { message: err.message } }
				: {}),
		},
	});
}
