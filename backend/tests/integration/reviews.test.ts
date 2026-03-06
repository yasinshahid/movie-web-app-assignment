import { describe, expect, it } from 'vitest';

import {
	api,
	createMovie,
	createReview,
	loginUser,
	registerUser,
	uniqueEmail,
} from '../helpers/testUtils';

describe('Reviews API', () => {
	async function makeUserAndToken(label: string) {
		const email = uniqueEmail(label);
		const password = 'Password123!';
		await registerUser({ email, password });
		const login = await loginUser({ email, password });
		return { email, token: login.body.accessToken as string };
	}

	it('GET /api/movies/:movieId/reviews works for existing movie', async () => {
		const { token } = await makeUserAndToken('reviews');
		const created = await createMovie({ token, title: 'Alien', description: null });
		const movieId = created.body.movie.id as string;

		const res = await api.get(`/api/movies/${movieId}/reviews`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.items)).toBe(true);
		expect(res.body.total).toBe(0);
	});

	it('create review requires auth; create success; duplicate returns 409; non-existent movie returns 404', async () => {
		const user = await makeUserAndToken('reviews');
		const created = await createMovie({ token: user.token, title: 'The Thing', description: null });
		const movieId = created.body.movie.id as string;

		const noAuth = await api
			.post(`/api/movies/${movieId}/reviews`)
			.set('Content-Type', 'application/json')
			.send({ rating: 5, comment: null });
		expect(noAuth.status).toBe(401);

		const ok = await createReview({ token: user.token, movieId, rating: 5, comment: 'Nice' });
		expect(ok.status).toBe(201);
		expect(ok.body).toHaveProperty('review');
		expect(ok.body.review).toMatchObject({ rating: 5, comment: 'Nice' });
		expect(ok.body.review.user).toHaveProperty('email');

		const dup = await createReview({ token: user.token, movieId, rating: 4, comment: null });
		expect(dup.status).toBe(409);

		const missing = await createReview({ token: user.token, movieId: 'does-not-exist', rating: 5, comment: null });
		expect(missing.status).toBe(404);
	});

	it('update/delete: owner succeeds; non-owner gets 403', async () => {
		const owner = await makeUserAndToken('owner');
		const other = await makeUserAndToken('other');

		const movie = await createMovie({ token: owner.token, title: 'Blade Runner', description: null });
		const movieId = movie.body.movie.id as string;

		const created = await createReview({ token: owner.token, movieId, rating: 5, comment: 'Great' });
		const reviewId = created.body.review.id as string;

		const ownerUpdate = await api
			.patch(`/api/reviews/${reviewId}`)
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${owner.token}`)
			.send({ rating: 4 });
		expect(ownerUpdate.status).toBe(200);
		expect(ownerUpdate.body.review).toMatchObject({ rating: 4 });

		const otherUpdate = await api
			.patch(`/api/reviews/${reviewId}`)
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${other.token}`)
			.send({ rating: 1 });
		expect(otherUpdate.status).toBe(403);

		const otherDelete = await api
			.delete(`/api/reviews/${reviewId}`)
			.set('Authorization', `Bearer ${other.token}`);
		expect(otherDelete.status).toBe(403);

		const ownerDelete = await api
			.delete(`/api/reviews/${reviewId}`)
			.set('Authorization', `Bearer ${owner.token}`);
		expect(ownerDelete.status).toBe(204);
	});

	it('rating validation is enforced (400)', async () => {
		const { token } = await makeUserAndToken('rating');
		const movie = await createMovie({ token, title: 'Alien', description: null });
		const movieId = movie.body.movie.id as string;

		const bad = await api
			.post(`/api/movies/${movieId}/reviews`)
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${token}`)
			.send({ rating: 6, comment: null });

		expect(bad.status).toBe(400);
		expect(bad.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
	});
});
