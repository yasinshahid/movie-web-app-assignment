<script setup lang="ts">
import { ref, watch } from 'vue';

import type { MovieListItem } from '../api/movies';
import * as moviesApi from '../api/movies';
import { getFriendlyApiErrorMessage } from '../utils/apiErrorMessage';

const props = defineProps<{ movie: MovieListItem }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const title = ref('');
const description = ref('');
const posterUrl = ref('');
const trailerUrl = ref('');
const releaseYear = ref<string>('');

const errorMessage = ref<string | null>(null);
const isSaving = ref(false);

function normalizeString(val: unknown) {
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

function syncFromMovie(movie: MovieListItem) {
	title.value = movie.title ?? '';
	description.value = movie.description ?? '';
	posterUrl.value = movie.posterUrl ?? '';
	trailerUrl.value = movie.trailerUrl ?? '';
	releaseYear.value = movie.releaseYear ? String(movie.releaseYear) : '';
	errorMessage.value = null;
}

watch(
	() => props.movie,
	(movie) => {
		syncFromMovie(movie);
	},
	{ immediate: true },
);

async function onSubmit() {
	errorMessage.value = null;

	const trimmedTitle = title.value.trim();
	if (!trimmedTitle) {
		errorMessage.value = 'Title is required.';
		return;
	}

	isSaving.value = true;
	try {
		await moviesApi.updateMovie(props.movie.id, {
			title: trimmedTitle,
			description: normalizeString(description.value),
			posterUrl: normalizeString(posterUrl.value),
			trailerUrl: normalizeString(trailerUrl.value),
			releaseYear: normalizeReleaseYear(releaseYear.value),
		});
		emit('saved');
	} catch (err: any) {
		errorMessage.value = getFriendlyApiErrorMessage(err, {
			context: 'movie-edit',
			fallbackMessage: 'Something went wrong.',
		});
	} finally {
		isSaving.value = false;
	}
}
</script>

<template>
	<Teleport to="body">
		<div class="overlay" @mousedown.self="emit('close')">
			<div class="modal card">
				<header class="modalHeader">
					<h2 class="modalTitle">Edit movie</h2>
					<button type="button" class="btnSm" @click="emit('close')">Close</button>
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

					<label class="field">
						<span>Poster URL (optional)</span>
						<input v-model="posterUrl" type="url" placeholder="https://..." autocomplete="off" />
					</label>

					<label class="field">
						<span>Trailer URL (optional)</span>
						<input v-model="trailerUrl" type="url" placeholder="https://..." autocomplete="off" />
					</label>

					<label class="field">
						<span>Release year (optional)</span>
						<input v-model="releaseYear" type="number" inputmode="numeric" placeholder="e.g. 1982" />
					</label>

					<p v-if="errorMessage" class="errorBox error">{{ errorMessage }}</p>

					<div class="actions modalActions">
						<button type="button" :disabled="isSaving" @click="emit('close')">Cancel</button>
						<button type="submit" class="btnPrimary" :disabled="isSaving">
							{{ isSaving ? 'Saving…' : 'Save changes' }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.overlay {
	position: fixed;
	inset: 0;
	background: rgba(17, 24, 39, 0.35);
	display: grid;
	place-items: center;
	padding: 16px;
	z-index: 50;
}

.modal {
	width: min(720px, 100%);
	padding: 16px;
}

.modalHeader {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;
}

.modalTitle {
	margin: 0;
	font-size: 18px;
}

.modalActions {
	justify-content: flex-end;
}
</style>
