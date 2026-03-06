import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/errors';
import * as moviesService from './movies.service';

export const listMovies = asyncHandler(async (req: Request, res: Response) => {
	const { query, sort, page, pageSize } = req.query as {
		query?: string;
		sort?: 'recent' | 'reviewCount';
		page?: string;
		pageSize?: string;
	};

	const result = await moviesService.listMovies({
		query,
		sort,
		page: page ? Number(page) : undefined,
		pageSize: pageSize ? Number(pageSize) : undefined,
	});

	res.status(200).json(result);
});

export const getMovie = asyncHandler(async (req: Request, res: Response) => {
	const { movieId } = req.params as { movieId: string };
	const result = await moviesService.getMovie(movieId);
	res.status(200).json(result);
});

export const createMovie = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { title, description, posterUrl, trailerUrl, releaseYear } = req.body as {
		title: string;
		description?: string | null;
		posterUrl?: string | null;
		trailerUrl?: string | null;
		releaseYear?: number | null;
	};

	const result = await moviesService.createMovie({
		ownerId: userId,
		title,
		description,
		posterUrl,
		trailerUrl,
		releaseYear,
	});

	res.status(201).json(result);
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { movieId } = req.params as { movieId: string };
	const { title, description, posterUrl, trailerUrl, releaseYear } = req.body as {
		title?: string;
		description?: string | null;
		posterUrl?: string | null;
		trailerUrl?: string | null;
		releaseYear?: number | null;
	};

	const result = await moviesService.updateMovie({
		movieId,
		userId,
		data: { title, description, posterUrl, trailerUrl, releaseYear },
	});

	res.status(200).json(result);
});

export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.auth?.userId;
	if (!userId) {
		throw new AppError({
			statusCode: 401,
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		});
	}

	const { movieId } = req.params as { movieId: string };
	await moviesService.deleteMovie({ movieId, userId });
	res.status(204).send();
});
