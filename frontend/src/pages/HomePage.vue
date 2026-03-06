<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
</script>

<template>
	<section class="page">
		<h1>Home</h1>
		<p class="muted">You are logged in as <strong>{{ auth.currentUser?.email }}</strong>.</p>
		<p class="muted">Movies UI is not implemented yet (auth only).</p>
	</section>
</template>

<style scoped>
.page {
	max-width: 480px;
}

.muted {
	opacity: 0.85;
}
</style>
