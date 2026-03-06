import { prisma } from '../../utils/prisma';
import { AppError } from '../../utils/errors';

export type ReviewItem = {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;
	user: { id: string; email: string };
};

function toReviewItem(review: {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: Date;
	updatedAt: Date;
	user: { id: string; email: string };
}): ReviewItem {
	return {
		id: review.id,
		rating: review.rating,
		comment: review.comment,
		createdAt: review.createdAt.toISOString(),
		updatedAt: review.updatedAt.toISOString(),
		user: review.user,
	};
}

async function assertMovieExists(movieId: string) {
	const movie = await prisma.movie.findUnique({
		where: { id: movieId },
		select: { id: true },
	});

	if (!movie) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Movie not found',
		});
	}
}

export async function listMovieReviews(input: {
	movieId: string;
	page?: number;
	pageSize?: number;
}) {
	await assertMovieExists(input.movieId);

	const page = input.page ?? 1;
	const pageSize = input.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where = { movieId: input.movieId };

	const [total, reviews] = await Promise.all([
		prisma.review.count({ where }),
		prisma.review.findMany({
			where,
			orderBy: [{ createdAt: 'desc' }],
			skip,
			take: pageSize,
			select: {
				id: true,
				rating: true,
				comment: true,
				createdAt: true,
				updatedAt: true,
				user: { select: { id: true, email: true } },
			},
		}),
	]);

	return {
		items: reviews.map(toReviewItem),
		page,
		pageSize,
		total,
	};
}

export async function createReview(input: {
	movieId: string;
	userId: string;
	rating: number;
	comment?: string | null;
}) {
	await assertMovieExists(input.movieId);

	try {
		const review = await prisma.review.create({
			data: {
				movieId: input.movieId,
				userId: input.userId,
				rating: input.rating,
				comment: input.comment ?? null,
			},
			select: {
				id: true,
				rating: true,
				comment: true,
				createdAt: true,
				updatedAt: true,
				user: { select: { id: true, email: true } },
			},
		});

		return { review: toReviewItem(review) };
	} catch (err: any) {
		if (err?.code === 'P2002') {
			throw new AppError({
				statusCode: 409,
				code: 'CONFLICT',
				message: 'You have already reviewed this movie',
			});
		}
		throw err;
	}
}

export async function updateReview(input: {
	reviewId: string;
	userId: string;
	data: { rating?: number; comment?: string | null };
}) {
	const existing = await prisma.review.findUnique({
		where: { id: input.reviewId },
		select: { id: true, userId: true },
	});

	if (!existing) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Review not found',
		});
	}

	if (existing.userId !== input.userId) {
		throw new AppError({
			statusCode: 403,
			code: 'FORBIDDEN',
			message: 'Not allowed',
		});
	}

	const review = await prisma.review.update({
		where: { id: input.reviewId },
		data: {
			...(input.data.rating !== undefined ? { rating: input.data.rating } : {}),
			...(input.data.comment !== undefined ? { comment: input.data.comment } : {}),
		},
		select: {
			id: true,
			rating: true,
			comment: true,
			createdAt: true,
			updatedAt: true,
			user: { select: { id: true, email: true } },
		},
	});

	return { review: toReviewItem(review) };
}

export async function deleteReview(input: { reviewId: string; userId: string }) {
	const existing = await prisma.review.findUnique({
		where: { id: input.reviewId },
		select: { id: true, userId: true },
	});

	if (!existing) {
		throw new AppError({
			statusCode: 404,
			code: 'NOT_FOUND',
			message: 'Review not found',
		});
	}

	if (existing.userId !== input.userId) {
		throw new AppError({
			statusCode: 403,
			code: 'FORBIDDEN',
			message: 'Not allowed',
		});
	}

	await prisma.review.delete({ where: { id: input.reviewId } });
}
