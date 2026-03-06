import type { ZodError } from 'zod';

export type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'INTERNAL_ERROR';

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code: ErrorCode;
	public readonly details?: unknown;

	constructor(params: {
		statusCode: number;
		code: ErrorCode;
		message: string;
		details?: unknown;
	}) {
		super(params.message);
		this.statusCode = params.statusCode;
		this.code = params.code;
		this.details = params.details;
	}
}

export function toFieldErrors(zodError: ZodError) {
	return zodError.issues.map((issue) => ({
		field: issue.path.join('.'),
		message: issue.message,
	}));
}
