import { z } from 'zod';

const cuid = z.string().min(1);

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(2000);
const url = z.string().trim().url().max(2000);
const releaseYear = z.number().int().min(1888).max(2100);

export const listMoviesSchema = z.object({
	body: z.unknown().optional(),
	params: z.object({}).passthrough(),
	query: z.object({
		query: z.string().trim().min(1).max(200).optional(),
		sort: z.enum(['recent', 'reviewCount']).optional(),
		page: z.coerce.number().int().positive().optional(),
		pageSize: z.coerce.number().int().positive().max(100).optional(),
	}).passthrough(),
});

export const movieIdParamSchema = z.object({
	body: z.unknown().optional(),
	query: z.object({}).passthrough(),
	params: z.object({
		movieId: cuid,
	}),
});

export const createMovieSchema = z.object({
	params: z.object({}).passthrough(),
	query: z.object({}).passthrough(),
	body: z.object({
		title,
		description: description.optional().nullable(),
		posterUrl: url.optional().nullable(),
		trailerUrl: url.optional().nullable(),
		releaseYear: releaseYear.optional().nullable(),
	}),
});

export const updateMovieSchema = z.object({
	params: z.object({
		movieId: cuid,
	}),
	query: z.object({}).passthrough(),
	body: z
		.object({
			title: title.optional(),
			description: description.optional().nullable(),
			posterUrl: url.optional().nullable(),
			trailerUrl: url.optional().nullable(),
			releaseYear: releaseYear.optional().nullable(),
		})
		.refine((val) => Object.keys(val).length > 0, {
			message: 'At least one field must be provided',
		}),
});
