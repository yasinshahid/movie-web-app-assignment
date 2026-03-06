<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const posterPreviewStatus = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle');

const posterPreviewUrl = computed(() => {
	const trimmed = typeof posterUrl.value === 'string' ? posterUrl.value.trim() : '';
	return trimmed.length > 0 ? trimmed : null;
});

const trailerPreviewUrl = computed(() => {
	const trimmed = typeof trailerUrl.value === 'string' ? trailerUrl.value.trim() : '';
	return trimmed.length > 0 ? trimmed : null;
});

function normalizeEmbedUrl(raw: string): string | null {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}

	const host = url.hostname.replace(/^www\./, '');

	if (host === 'youtu.be') {
		const id = url.pathname.split('/').filter(Boolean)[0];
		return id ? `https://www.youtube.com/embed/${id}` : null;
	}

	if (host === 'youtube.com' || host === 'm.youtube.com') {
		if (url.pathname.startsWith('/embed/')) return raw;
		if (url.pathname === '/watch') {
			const id = url.searchParams.get('v');
			return id ? `https://www.youtube.com/embed/${id}` : null;
		}
		if (url.pathname.startsWith('/shorts/')) {
			const id = url.pathname.split('/').filter(Boolean)[1];
			return id ? `https://www.youtube.com/embed/${id}` : null;
		}
	}

	if (host === 'vimeo.com') {
		const id = url.pathname.split('/').filter(Boolean)[0];
		return id ? `https://player.vimeo.com/video/${id}` : null;
	}

	return null;
}

const trailerEmbedUrl = computed(() => {
	const raw = trailerPreviewUrl.value;
	if (!raw) return null;
	return normalizeEmbedUrl(raw);
});

watch(
	posterPreviewUrl,
	(url) => {
		posterPreviewStatus.value = url ? 'loading' : 'idle';
	},
	{ immediate: true },
);


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

				<div v-if="posterPreviewUrl" class="previewBlock">
					<div class="posterPreviewBox">
						<img
							v-if="posterPreviewStatus !== 'error'"
							class="posterPreviewImg"
							:src="posterPreviewUrl"
							alt="Poster preview"
							loading="lazy"
							@load="posterPreviewStatus = 'loaded'"
							@error="posterPreviewStatus = 'error'"
						/>
						<div v-else class="posterPreviewFallback muted">
							Could not preview this image. Use a direct image URL.
						</div>
					</div>
				</div>
			</label>

			<label class="field">
				<span>Trailer URL (optional)</span>
				<input v-model="trailerUrl" type="url" placeholder="https://..." autocomplete="off" />
				<small class="hint muted">YouTube/Vimeo links embed automatically when possible.</small>

				<div v-if="trailerPreviewUrl" class="previewBlock">
					<div v-if="trailerEmbedUrl" class="trailerPreviewFrame">
						<iframe
							:src="trailerEmbedUrl"
							title="Trailer preview"
							loading="lazy"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
						/>
					</div>
					<p v-else class="muted trailerPreviewFallback">Trailer preview is not available for this URL.</p>
				</div>
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

.previewBlock {
	margin-top: 8px;
}

.posterPreviewBox {
	width: 96px;
	height: 144px;
	border-radius: var(--radius-sm);
	border: 1px solid var(--border);
	overflow: hidden;
	background: var(--hover);
	display: grid;
	place-items: center;
}

.posterPreviewImg {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}

.posterPreviewFallback {
	padding: 8px;
	font-size: 12px;
	font-weight: 700;
	text-align: center;
}

.trailerPreviewFrame {
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	aspect-ratio: 16 / 9;
}

.trailerPreviewFrame iframe {
	width: 100%;
	height: 100%;
	border: 0;
	display: block;
}

.trailerPreviewFallback {
	margin: 0;
	font-size: 13px;
}

</style>
