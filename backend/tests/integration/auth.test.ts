import { describe, expect, it } from 'vitest';

import { api, registerUser, loginUser, uniqueEmail } from '../helpers/testUtils';

describe('Auth API', () => {
	it('register success; duplicate email returns 409', async () => {
		const email = uniqueEmail('auth');
		const password = 'Password123!';

		const r1 = await registerUser({ email, password });
		expect(r1.status).toBe(201);
		expect(r1.body).toHaveProperty('user');
		expect(r1.body.user).toMatchObject({ email });
		expect(typeof r1.body.user.id).toBe('string');

		const r2 = await registerUser({ email, password });
		expect(r2.status).toBe(409);
		expect(r2.body).toMatchObject({
			error: { code: 'CONFLICT' },
		});
	});

	it('login success; invalid login returns 401', async () => {
		const email = uniqueEmail('auth');
		const password = 'Password123!';

		await registerUser({ email, password });

		const ok = await loginUser({ email, password });
		expect(ok.status).toBe(200);
		expect(typeof ok.body.accessToken).toBe('string');
		expect(ok.body.user).toMatchObject({ email });

		const bad = await loginUser({ email, password: 'WrongPassword123!' });
		expect(bad.status).toBe(401);
		expect(bad.body).toMatchObject({
			error: { code: 'UNAUTHORIZED' },
		});
	});

	it('GET /api/auth/me: without token 401; with token 200', async () => {
		const email = uniqueEmail('auth');
		const password = 'Password123!';

		await registerUser({ email, password });
		const login = await loginUser({ email, password });
		const token = login.body.accessToken as string;

		const noToken = await api.get('/api/auth/me');
		expect(noToken.status).toBe(401);

		const me = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
		expect(me.status).toBe(200);
		expect(me.body.user).toMatchObject({ email });
	});
});
