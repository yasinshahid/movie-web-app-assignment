<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import * as moviesApi from '../api/movies';
import { getFriendlyApiErrorMessage } from '../utils/apiErrorMessage';

const router = useRouter();

const title = ref('');
const description = ref('');
const posterUrl = ref('');
const trailerUrl = ref('');
const releaseYear = ref<string>('');

const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);


function normalizeDescription(val: unknown) {
	if (typeof val !== 'string') return null;
	const trimmed = val.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrl(val: unknown) {
	if (typeof val !== 'string') return null;
	const trimmed = val.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeReleaseYear(val: unknown) {
	if (val === null || val === undefined) return null;
	if (typeof val === 'number') return Number.isFinite(val) ? Math.trunc(val) : null;
	if (typeof val !== 'string') return null;
	const trimmed = val.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? Math.trunc(n) : null;
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
		const payload = {
			title: trimmedTitle,
			description: normalizeDescription(description.value),
			posterUrl: normalizeUrl(posterUrl.value),
			trailerUrl: normalizeUrl(trailerUrl.value),
			releaseYear: normalizeReleaseYear(releaseYear.value),
		};
		const res = await moviesApi.createMovie({
			...payload,
		});
		await router.push(`/movies/${res.movie.id}`);
	} catch (err: any) {
		errorMessage.value = getFriendlyApiErrorMessage(err, {
			context: 'movie-create',
			fallbackMessage: 'Something went wrong.',
		});
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<section class="page pageNarrow">
		<header class="header">
			<div>
				<h1 class="title">Create Movie</h1>
				<p class="subtitle">Add a movie with optional poster and trailer links.</p>
			</div>
			<RouterLink class="navLink" to="/">← Back</RouterLink>
		</header>

		<form class="card form" @submit.prevent="onSubmit">
			<label class="field">
				<span>Title</span>
				<input v-model="title" type="text" autocomplete="off" required />
			</label>

			<label class="field">
				<span>Description (optional)</span>
				<textarea v-model="description" rows="4" />
			</label>

			<label class="field">
				<span>Poster URL (optional)</span>
				<input v-model="posterUrl" type="url" placeholder="https://..." autocomplete="off" />
				<small class="hint muted">
					Use a direct image URL ending in .jpg, .jpeg, .png, or a public image CDN link.
				</small>
			</label>

			<label class="field">
				<span>Trailer URL (optional)</span>
				<input v-model="trailerUrl" type="url" placeholder="https://..." autocomplete="off" />
				<small class="hint muted">YouTube/Vimeo links embed automatically when possible.</small>
			</label>

			<label class="field">
				<span>Release year (optional)</span>
				<input v-model="releaseYear" type="number" inputmode="numeric" placeholder="e.g. 1982" />
			</label>

			<p v-if="errorMessage" class="errorBox error">{{ errorMessage }}</p>

			<button type="submit" class="btnPrimary" :disabled="isSubmitting">
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

.hint {
	font-weight: 400;
	font-size: 12px;
}

</style>
