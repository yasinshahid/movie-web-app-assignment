import request from 'supertest';
import { beforeEach, afterAll } from 'vitest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/utils/prisma';

export const app = createApp({ requestLogger: false });
export const api = request(app);

export async function resetDatabase() {
	await prisma.review.deleteMany();
	await prisma.movie.deleteMany();
	await prisma.user.deleteMany();
}

beforeEach(async () => {
	await resetDatabase();
});

afterAll(async () => {
	await prisma.$disconnect();
});

export async function registerUser(input: { email: string; password: string }) {
	return api
		.post('/api/auth/register')
		.set('Content-Type', 'application/json')
		.send(input);
}

export async function loginUser(input: { email: string; password: string }) {
	return api
		.post('/api/auth/login')
		.set('Content-Type', 'application/json')
		.send(input);
}

export function authHeader(token: string) {
	return { Authorization: `Bearer ${token}` };
}

export async function createMovie(input: {
	token: string;
	title: string;
	description?: string | null;
}) {
	return api
		.post('/api/movies')
		.set('Content-Type', 'application/json')
		.set(authHeader(input.token))
		.send({ title: input.title, description: input.description ?? null });
}

export async function createReview(input: {
	token: string;
	movieId: string;
	rating: number;
	comment?: string | null;
}) {
	return api
		.post(`/api/movies/${input.movieId}/reviews`)
		.set('Content-Type', 'application/json')
		.set(authHeader(input.token))
		.send({ rating: input.rating, comment: input.comment ?? null });
}

export function uniqueEmail(prefix: string) {
	return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}
