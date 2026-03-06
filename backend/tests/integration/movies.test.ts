import { describe, expect, it } from 'vitest';

import {
	api,
	createMovie,
	loginUser,
	registerUser,
	uniqueEmail,
} from '../helpers/testUtils';

describe('Movies API', () => {
	async function makeUserAndToken(label: string) {
		const email = uniqueEmail(label);
		const password = 'Password123!';
		await registerUser({ email, password });
		const login = await loginUser({ email, password });
		return { email, token: login.body.accessToken as string };
	}

	it('public GET /api/movies works', async () => {
		const res = await api.get('/api/movies');
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('items');
		expect(Array.isArray(res.body.items)).toBe(true);
	});

	it('create movie requires auth; create success; duplicate title returns 409', async () => {
		const noAuth = await api
			.post('/api/movies')
			.set('Content-Type', 'application/json')
			.send({ title: 'Alien', description: null });
		expect(noAuth.status).toBe(401);

		const { token } = await makeUserAndToken('movies');

		const created = await createMovie({ token, title: 'Alien', description: 'Sci-fi' });
		expect(created.status).toBe(201);
		expect(created.body).toHaveProperty('movie');
		expect(created.body.movie).toMatchObject({ title: 'Alien' });

		const dup = await createMovie({ token, title: 'Alien', description: 'Dup' });
		expect(dup.status).toBe(409);
		expect(dup.body).toMatchObject({ error: { code: 'CONFLICT' } });
	});

	it('update/delete: owner succeeds; non-owner gets 403', async () => {
		const owner = await makeUserAndToken('owner');
		const other = await makeUserAndToken('other');

		const created = await createMovie({ token: owner.token, title: 'The Thing', description: null });
		const movieId = created.body.movie.id as string;

		const ownerUpdate = await api
			.patch(`/api/movies/${movieId}`)
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${owner.token}`)
			.send({ description: 'Updated' });
		expect(ownerUpdate.status).toBe(200);

		const otherUpdate = await api
			.patch(`/api/movies/${movieId}`)
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${other.token}`)
			.send({ description: 'Hack' });
		expect(otherUpdate.status).toBe(403);

		const otherDelete = await api
			.delete(`/api/movies/${movieId}`)
			.set('Authorization', `Bearer ${other.token}`);
		expect(otherDelete.status).toBe(403);

		const ownerDelete = await api
			.delete(`/api/movies/${movieId}`)
			.set('Authorization', `Bearer ${owner.token}`);
		expect(ownerDelete.status).toBe(204);
	});

	it('search by title returns matching movies', async () => {
		const { token } = await makeUserAndToken('search');

		await createMovie({ token, title: 'Blade Runner', description: null });
		await createMovie({ token, title: 'Alien', description: null });

		const res = await api.get('/api/movies').query({ query: 'Blade' });
		expect(res.status).toBe(200);

		const titles = (res.body.items as Array<any>).map((m) => m.title);
		expect(titles).toContain('Blade Runner');
		expect(titles).not.toContain('Alien');
	});
});
