import { http } from './http';

export type User = {
	id: string;
	email: string;
	createdAt: string;
};

export async function register(input: { email: string; password: string }) {
	const res = await http.post('/auth/register', input);
	return res.data as { user: User };
}

export async function login(input: { email: string; password: string }) {
	const res = await http.post('/auth/login', input);
	return res.data as { accessToken: string; user: User };
}

export async function getCurrentUser() {
	const res = await http.get('/auth/me');
	return res.data as { user: User };
}
