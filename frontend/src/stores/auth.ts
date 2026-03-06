import { defineStore } from 'pinia';

import * as authApi from '../api/auth';
import { ACCESS_TOKEN_STORAGE_KEY } from '../api/http';

type AuthState = {
	accessToken: string | null;
	currentUser: authApi.User | null;
	isInitialized: boolean;
};

export const useAuthStore = defineStore('auth', {
	state: (): AuthState => ({
		accessToken: null,
		currentUser: null,
		isInitialized: false,
	}),
	getters: {
		isAuthenticated: (state) => Boolean(state.accessToken && state.currentUser),
	},
	actions: {
		setAccessToken(token: string | null) {
			this.accessToken = token;
			if (token) {
				localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
			} else {
				localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
			}
		},

		async init() {
			const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
			if (token) {
				this.accessToken = token;
				try {
					const me = await authApi.getCurrentUser();
					this.currentUser = me.user;
				} catch {
					this.logout();
				}
			}
			this.isInitialized = true;
		},

		async login(input: { email: string; password: string }) {
			const res = await authApi.login(input);
			this.setAccessToken(res.accessToken);
			this.currentUser = res.user;
		},

		async register(input: { email: string; password: string }) {
			await authApi.register(input);
			// Backend register doesn't return a token; auto-login to update auth state.
			await this.login(input);
		},

		logout() {
			this.setAccessToken(null);
			this.currentUser = null;
		},
	},
});
