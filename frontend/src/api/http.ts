import axios from 'axios';

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

export const http = axios.create({
	baseURL,
	headers: {
		Accept: 'application/json',
	},
});

http.interceptors.request.use((config) => {
	const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});
