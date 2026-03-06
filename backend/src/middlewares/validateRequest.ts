import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateRequest(schema: ZodTypeAny) {
	return (req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse({
			body: req.body,
			params: req.params,
			query: req.query,
		});

		if (!result.success) {
			throw result.error;
		}

		// Only replace req.body. Express 5 may expose req.query as a getter.
		if (result.data && typeof result.data === 'object' && 'body' in result.data) {
			req.body = (result.data as any).body;
		} else {
			req.body = result.data;
		}
		next();
	};
}
