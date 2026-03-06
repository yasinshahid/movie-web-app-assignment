import { z } from 'zod';

const cuid = z.string().min(1);

const rating = z.number().int().min(1).max(5);
const comment = z.string().trim().max(2000);

export const movieIdParamSchema = z.object({
	body: z.unknown().optional(),
	query: z.object({
		page: z.coerce.number().int().positive().optional(),
		pageSize: z.coerce.number().int().positive().max(100).optional(),
	}).passthrough(),
	params: z.object({
		movieId: cuid,
	}),
});

export const reviewIdParamSchema = z.object({
	body: z.unknown().optional(),
	query: z.object({}).passthrough(),
	params: z.object({
		reviewId: cuid,
	}),
});

export const createReviewSchema = z.object({
	params: z.object({
		movieId: cuid,
	}),
	query: z.object({}).passthrough(),
	body: z.object({
		rating,
		comment: comment.optional().nullable(),
	}),
});

export const updateReviewSchema = z.object({
	params: z.object({
		reviewId: cuid,
	}),
	query: z.object({}).passthrough(),
	body: z
		.object({
			rating: rating.optional(),
			comment: comment.optional().nullable(),
		})
		.refine((val) => Object.keys(val).length > 0, {
			message: 'At least one field must be provided',
		}),
});
