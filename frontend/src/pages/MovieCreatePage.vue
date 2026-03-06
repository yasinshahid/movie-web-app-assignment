<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import * as moviesApi from '../api/movies';

const router = useRouter();

const title = ref('');
const description = ref('');

const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);

function normalizeDescription(val: string) {
	const trimmed = val.trim();
	return trimmed.length > 0 ? trimmed : null;
}

async function onSubmit() {
	errorMessage.value = null;

	const trimmedTitle = title.value.trim();
	if (!trimmedTitle) {
		errorMessage.value = 'Title is required.';
		return;
	}

	isSubmitting.value = true;
	try {
		const res = await moviesApi.createMovie({
			title: trimmedTitle,
			description: normalizeDescription(description.value),
		});
		await router.push(`/movies/${res.movie.id}`);
	} catch (err: any) {
		const status = err?.response?.status;
		if (status === 409) {
			errorMessage.value = 'Movie title already exists.';
		} else {
			errorMessage.value = err?.response?.data?.error?.message ?? 'Failed to create movie.';
		}
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="page pageNarrow">
		<header class="header">
			<h1 class="title">Create Movie</h1>
			<RouterLink to="/">Back to movies</RouterLink>
		</header>

		<form class="form" @submit.prevent="onSubmit">
			<label class="field">
				<span>Title</span>
				<input v-model="title" type="text" autocomplete="off" required />
			</label>

			<label class="field">
				<span>Description (optional)</span>
				<textarea v-model="description" rows="4" />
			</label>

			<p v-if="errorMessage" class="error">{{ errorMessage }}</p>

			<button type="submit" :disabled="isSubmitting">
				{{ isSubmitting ? 'Creating movie...' : 'Create' }}
			</button>
		</form>
	</section>
</template>

<style scoped>
.header {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	align-items: baseline;
	margin-bottom: 12px;
}
</style>
