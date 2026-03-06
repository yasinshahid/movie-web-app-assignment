<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import { getFriendlyAuthErrorMessage } from '../utils/authErrorMessage';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);

async function onSubmit() {
	errorMessage.value = null;
	isSubmitting.value = true;
	try {
		await auth.login({ email: email.value, password: password.value });
		const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
		await router.push(redirect);
	} catch (err: any) {
		errorMessage.value = getFriendlyAuthErrorMessage(err, 'Login failed');
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="authScreen">
		<div class="authInner">
			<header class="header">
				<h1 class="title">Login</h1>
				<p class="subtitle">Sign in to create movies and manage your reviews.</p>
			</header>

			<form class="card form authCard" @submit.prevent="onSubmit">
			<label class="field">
				<span>Email</span>
				<input v-model="email" type="email" autocomplete="email" required />
			</label>

			<label class="field">
				<span>Password</span>
				<input v-model="password" type="password" autocomplete="current-password" required />
			</label>

			<p v-if="errorMessage" class="errorBox error">{{ errorMessage }}</p>

			<button type="submit" class="btnPrimary" :disabled="isSubmitting">
				{{ isSubmitting ? 'Logging in…' : 'Login' }}
			</button>
			</form>

			<p class="footer muted">
				No account? <RouterLink to="/register">Register</RouterLink>
			</p>
		</div>
	</section>
</template>

<style scoped>
.authScreen {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 0;
}

.authInner {
	width: 100%;
	max-width: 460px;
}

.authCard {
	padding: 16px;
}

.header {
	margin-bottom: 12px;
}

.footer {
	margin-top: 12px;
}
</style>
