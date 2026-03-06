import { prisma } from '../../utils/prisma';
import { AppError } from '../../utils/errors';

export type MovieListItem = {
	id: string;
	title: string;
	description: string | null;
	posterUrl: string | null;
	trailerUrl: string | null;
	releaseYear: number | null;
	owner: { id: string; email: string };
	reviewCount: number;
	createdAt: string;
	updatedAt: string;
};

function toListItem(movie: {
	id: string;
	title: string;
	description: string | null;
	posterUrl: string | null;
	trailerUrl: string | null;
	releaseYear: number | null;
	createdAt: Date;
	updatedAt: Date;
	owner: { id: string; email: string };
	_count: { reviews: number };
}): MovieListItem {
	return {
		id: movie.id,
		title: movie.title,
		description: movie.description,
		posterUrl: movie.posterUrl,
		trailerUrl: movie.trailerUrl,
		releaseYear: movie.releaseYear,
		owner: movie.owner,
		reviewCount: movie._count.reviews,
		createdAt: movie.createdAt.toISOString(),
		updatedAt: movie.updatedAt.toISOString(),
	};
}

export async function listMovies(input: {
	query?: string;
	sort?: 'recent' | 'reviewCount';
	page?: number;
	pageSize?: number;
}) {
	const page = input.page ?? 1;
	const pageSize = input.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where = input.query
		? {
			title: {
				contains: input.query,
				mode: 'insensitive' as const,
			},
		}
		: undefined;

	const orderBy =
		input.sort === 'reviewCount'
			? ([
				{ reviews: { _count: 'desc' as const } },
				{ createdAt: 'desc' as const },
			] as const)
			: ([{ createdAt: 'desc' as const }] as const);

	const [total, movies] = await Promise.all([
		prisma.movie.count({ where }),
		prisma.movie.findMany({
			where,
			orderBy: orderBy as any,
			skip,
			take: pageSize,
			select: {
				id: true,
				title: true,
				description: true,
				posterUrl: true,
				trailerUrl: true,
				releaseYear: true,
				createdAt: true,
				updatedAt: true,
				owner: { select: { id: true, email: true } },
				_count: { select: { reviews: true } },
			},
		}),
	]);

	return {
		items: movies.map(toListItem),
		page,
		pageSize,
		total,
	};
}

export async function getMovie(movieId: string) {
	const movie = await prisma.movie.findUnique({
		where: { id: movieId },
		select: {
			id: true,
			title: true,
			description: true,
			posterUrl: true,
			trailerUrl: true,
			releaseYear: true,
			createdAt: true,
			updatedAt: true,
			owner: { select: { id: true, email: true } },
			_count: { select: { reviews: true } },
		},
	});

	if (!movie) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Movie not found',
		});
	}

	return { movie: toListItem(movie) };
}

export async function createMovie(input: {
	ownerId: string;
	title: string;
	description?: string | null;
	posterUrl?: string | null;
	trailerUrl?: string | null;
	releaseYear?: number | null;
}) {
	try {
		const movie = await prisma.movie.create({
			data: {
				title: input.title.trim(),
				description: input.description ?? null,
				posterUrl: input.posterUrl?.trim() ?? null,
				trailerUrl: input.trailerUrl?.trim() ?? null,
				releaseYear: input.releaseYear ?? null,
				ownerId: input.ownerId,
			},
			select: {
				id: true,
				title: true,
				description: true,
				posterUrl: true,
				trailerUrl: true,
				releaseYear: true,
				createdAt: true,
				updatedAt: true,
				owner: { select: { id: true, email: true } },
				_count: { select: { reviews: true } },
			},
		});

		return {
			movie: toListItem(movie),
		};
	} catch (err: any) {
		if (err?.code === 'P2002') {
			throw new AppError({
				statusCode: 409,
				code: 'CONFLICT',
				message: 'Movie title already exists',
			});
		}
		throw err;
	}
}

export async function updateMovie(input: {
	movieId: string;
	userId: string;
	data: {
		title?: string;
		description?: string | null;
		posterUrl?: string | null;
		trailerUrl?: string | null;
		releaseYear?: number | null;
	};
}) {
	const existing = await prisma.movie.findUnique({
		where: { id: input.movieId },
		select: { id: true, ownerId: true },
	});

	if (!existing) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Movie not found',
		});
	}

	if (existing.ownerId !== input.userId) {
		throw new AppError({
			statusCode: 403,
			code: 'FORBIDDEN',
			message: 'Not allowed',
		});
	}

	try {
		const movie = await prisma.movie.update({
			where: { id: input.movieId },
			data: {
				...(input.data.title !== undefined
					? { title: input.data.title.trim() }
					: {}),
				...(input.data.description !== undefined
					? { description: input.data.description }
					: {}),
				...(input.data.posterUrl !== undefined
					? { posterUrl: input.data.posterUrl?.trim() ?? null }
					: {}),
				...(input.data.trailerUrl !== undefined
					? { trailerUrl: input.data.trailerUrl?.trim() ?? null }
					: {}),
				...(input.data.releaseYear !== undefined
					? { releaseYear: input.data.releaseYear }
					: {}),
			},
			select: {
				id: true,
				title: true,
				description: true,
				posterUrl: true,
				trailerUrl: true,
				releaseYear: true,
				createdAt: true,
				updatedAt: true,
				owner: { select: { id: true, email: true } },
				_count: { select: { reviews: true } },
			},
		});

		return {
			movie: toListItem(movie),
		};
	} catch (err: any) {
		if (err?.code === 'P2002') {
			throw new AppError({
				statusCode: 409,
				code: 'CONFLICT',
				message: 'Movie title already exists',
			});
		}
		throw err;
	}
}

export async function deleteMovie(input: {
	movieId: string;
	userId: string;
}) {
	const existing = await prisma.movie.findUnique({
		where: { id: input.movieId },
		select: { id: true, ownerId: true },
	});

	if (!existing) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Movie not found',
		});
	}

	if (existing.ownerId !== input.userId) {
		throw new AppError({
			statusCode: 403,
			code: 'FORBIDDEN',
			message: 'Not allowed',
		});
	}

	await prisma.movie.delete({ where: { id: input.movieId } });
}
