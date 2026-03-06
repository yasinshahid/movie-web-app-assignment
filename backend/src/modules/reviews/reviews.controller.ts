import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/errors';
import * as reviewsService from './reviews.service';

export const listMovieReviews = asyncHandler(async (req: Request, res: Response) => {
	const { movieId } = req.params as { movieId: string };
	const { page, pageSize } = req.query as { page?: string; pageSize?: string };

	const result = await reviewsService.listMovieReviews({
		movieId,
		page: page ? Number(page) : undefined,
		pageSize: pageSize ? Number(pageSize) : undefined,
	});

	res.status(200).json(result);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { movieId } = req.params as { movieId: string };
	const { rating, comment } = req.body as { rating: number; comment?: string | null };

	const result = await reviewsService.createReview({
		movieId,
		userId,
		rating,
		comment,
	});

	res.status(201).json(result);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { reviewId } = req.params as { reviewId: string };
	const { rating, comment } = req.body as { rating?: number; comment?: string | null };

	const result = await reviewsService.updateReview({
		reviewId,
		userId,
		data: { rating, comment },
	});

	res.status(200).json(result);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { reviewId } = req.params as { reviewId: string };
	await reviewsService.deleteReview({ reviewId, userId });
	res.status(204).send();
});
