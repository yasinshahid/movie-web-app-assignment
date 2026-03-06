<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';

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
		errorMessage.value = err?.response?.data?.error?.message ?? 'Login failed';
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="page pageNarrow">
		<h1 class="title">Login</h1>

		<form class="form" @submit.prevent="onSubmit">
			<label class="field">
				<span>Email</span>
				<input v-model="email" type="email" autocomplete="email" required />
			</label>

			<label class="field">
				<span>Password</span>
				<input v-model="password" type="password" autocomplete="current-password" required />
			</label>

			<p v-if="errorMessage" class="error">{{ errorMessage }}</p>

			<button type="submit" :disabled="isSubmitting">
				{{ isSubmitting ? 'Logging in…' : 'Login' }}
			</button>
		</form>

		<p class="muted">
			No account?
			<RouterLink to="/register">Register</RouterLink>
		</p>
	</section>
</template>

<style scoped>
.muted {
	margin-top: 12px;
}
</style>
