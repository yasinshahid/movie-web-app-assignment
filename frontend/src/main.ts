import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

import './style.css';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore(pinia);

router.beforeEach(async (to) => {
	if (!auth.isInitialized) {
		await auth.init();
	}

	const requiresAuth = Boolean(to.meta.requiresAuth);
	const requiresGuest = Boolean(to.meta.requiresGuest);

	if (requiresAuth && !auth.isAuthenticated) {
		return {
			path: '/login',
			query: { redirect: to.fullPath },
		};
	}

	if (requiresGuest && auth.isAuthenticated) {
		return { path: '/' };
	}

	return true;
});

app.mount('#app');
