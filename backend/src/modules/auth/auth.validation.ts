import { z } from 'zod';

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8);

export const registerSchema = z.object({
	body: z.object({
		email,
		password,
	}),
	params: z.object({}).passthrough(),
	query: z.object({}).passthrough(),
});

export const loginSchema = z.object({
	body: z.object({
		email,
		password,
	}),
	params: z.object({}).passthrough(),
	query: z.object({}).passthrough(),
});
