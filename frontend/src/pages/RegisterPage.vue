<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';
import { getFriendlyAuthErrorMessage } from '../utils/authErrorMessage';

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
		errorMessage.value = getFriendlyAuthErrorMessage(err, 'Registration failed');
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="authScreen">
		<div class="authInner">
			<header class="header">
				<h1 class="title">Register</h1>
				<p class="subtitle">Create an account to add movies and leave reviews.</p>
			</header>

			<form class="card form authCard" @submit.prevent="onSubmit">
			<label class="field">
				<span>Email</span>
				<input v-model="email" type="email" autocomplete="email" required />
			</label>

			<label class="field">
				<span>Password</span>
				<input v-model="password" type="password" autocomplete="new-password" required />
			</label>

			<p v-if="errorMessage" class="errorBox error">{{ errorMessage }}</p>

			<button type="submit" class="btnPrimary" :disabled="isSubmitting">
				{{ isSubmitting ? 'Creating…' : 'Register' }}
			</button>
			</form>

			<p class="footer muted">
				Already have an account? <RouterLink to="/login">Login</RouterLink>
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
