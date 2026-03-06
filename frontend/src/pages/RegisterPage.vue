<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);

async function onSubmit() {
	errorMessage.value = null;
	isSubmitting.value = true;
	try {
		await auth.register({ email: email.value, password: password.value });
		await router.push('/');
	} catch (err: any) {
		errorMessage.value = err?.response?.data?.error?.message ?? 'Registration failed';
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="page pageNarrow">
		<h1 class="title">Register</h1>

		<form class="form" @submit.prevent="onSubmit">
			<label class="field">
				<span>Email</span>
				<input v-model="email" type="email" autocomplete="email" required />
			</label>

			<label class="field">
				<span>Password</span>
				<input v-model="password" type="password" autocomplete="new-password" required />
			</label>

			<p v-if="errorMessage" class="error">{{ errorMessage }}</p>

			<button type="submit" :disabled="isSubmitting">
				{{ isSubmitting ? 'Creating…' : 'Register' }}
			</button>
		</form>

		<p class="muted">
			Already have an account?
			<RouterLink to="/login">Login</RouterLink>
		</p>
	</section>
</template>

<style scoped>
.muted {
	margin-top: 12px;
}
</style>
