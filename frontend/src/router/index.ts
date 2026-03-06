import { createRouter, createWebHistory } from 'vue-router';

import MovieDetailPage from '../pages/MovieDetailPage.vue';
import MoviesListPage from '../pages/MoviesListPage.vue';
import MovieCreatePage from '../pages/MovieCreatePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'movies',
			component: MoviesListPage,
		},
		{
			path: '/movies/new',
			name: 'movieNew',
			component: MovieCreatePage,
			meta: { requiresAuth: true },
		},
		{
			path: '/movies/:movieId',
			name: 'movieDetail',
			component: MovieDetailPage,
			props: true,
		},
		{
			path: '/login',
			name: 'login',
			component: LoginPage,
			meta: { requiresGuest: true },
		},
		{
			path: '/register',
			name: 'register',
			component: RegisterPage,
			meta: { requiresGuest: true },
		},
	],
});

export default router;
