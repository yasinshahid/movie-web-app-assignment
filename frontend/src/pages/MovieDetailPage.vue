<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import * as moviesApi from '../api/movies';
import * as reviewsApi from '../api/reviews';
import StarRating from '../components/common/StarRating.vue';
import EditMovieModal from '../components/EditMovieModal.vue';
import { useAuthStore } from '../stores/auth';
import { getFriendlyApiErrorMessage } from '../utils/apiErrorMessage';

const props = defineProps<{ movieId: string }>();

const auth = useAuthStore();
const router = useRouter();

const isLoading = ref(false);
const notFound = ref(false);
const errorMessage = ref<string | null>(null);

const actionMessage = ref<string | null>(null);
const actionErrorMessage = ref<string | null>(null);

const posterLoadFailed = ref(false);

const movie = ref<moviesApi.MovieListItem | null>(null);
const reviews = ref<reviewsApi.ReviewItem[]>([]);

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
	const raw = movie.value?.trailerUrl;
	if (!raw) return null;
	return normalizeEmbedUrl(raw);
});

const hasReviews = computed(() => reviews.value.length > 0);

const currentUserId = computed(() => auth.currentUser?.id ?? null);

const canEditMovie = computed(() => {
	if (!auth.isAuthenticated) return false;
	const userId = currentUserId.value;
	const ownerId = movie.value?.owner?.id;
	return Boolean(userId && ownerId && userId === ownerId);
});

const isEditOpen = ref(false);
const isDeletingMovie = ref(false);
const userReview = computed(() => {
	const userId = currentUserId.value;
	if (!userId) return null;
	return reviews.value.find((r) => r.user.id === userId) ?? null;
});

const canAddReview = computed(() => auth.isAuthenticated && !userReview.value);

const rating = ref<number>(5);
const comment = ref<string>('');

const isSubmitting = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);
const isEditing = ref(false);

function normalizeComment(val: string) {
	const trimmed = val.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function formatDate(iso: string) {
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function formatAverageRating(val: number | null) {
	if (val === null) return null;
	return `${val.toFixed(1)}/5`;
}

async function refresh(movieId: string, options?: { showLoading?: boolean }) {
	const showLoading = options?.showLoading ?? false;
	notFound.value = false;
	if (showLoading) {
		isLoading.value = true;
		errorMessage.value = null;
		movie.value = null;
		reviews.value = [];
	}

	try {
		const [movieRes, reviewsRes] = await Promise.all([
			moviesApi.getMovie(movieId),
			reviewsApi.listMovieReviews(movieId, { page: 1, pageSize: 20 }),
		]);
		movie.value = movieRes.movie;
		posterLoadFailed.value = false;
		reviews.value = reviewsRes.items;
	} catch (err: any) {
		const status = err?.response?.status;
		if (status === 404) {
			notFound.value = true;
		} else if (showLoading) {
			errorMessage.value = err?.response?.data?.error?.message ?? 'Failed to load movie';
		} else {
			actionErrorMessage.value = err?.response?.data?.error?.message ?? 'Failed to refresh';
		}
	} finally {
		if (showLoading) {
			isLoading.value = false;
		}
	}
}

async function load(movieId: string) {
	actionMessage.value = null;
	actionErrorMessage.value = null;
	isEditing.value = false;
	await refresh(movieId, { showLoading: true });
}

async function onDeleteMovie() {
	if (!canEditMovie.value) return;
	if (isDeletingMovie.value) return;

	const ok = window.confirm('Are you sure you want to delete this movie?');
	if (!ok) return;

	actionErrorMessage.value = null;
	actionMessage.value = 'Deleting movie...';
	isDeletingMovie.value = true;
	try {
		await moviesApi.deleteMovie(props.movieId);
		await router.push('/');
	} catch (err: any) {
		actionErrorMessage.value = getFriendlyApiErrorMessage(err, {
			context: 'movie-edit',
			fallbackMessage: 'Failed to delete movie.',
		});
	} finally {
		actionMessage.value = null;
		isDeletingMovie.value = false;
	}
}

async function onSubmitReview() {
	if (!auth.isAuthenticated) return;
	if (!movie.value) return;
	if (!canAddReview.value) return;

	actionErrorMessage.value = null;
	actionMessage.value = 'Submitting review...';
	isSubmitting.value = true;
	try {
		await reviewsApi.createMovieReview(props.movieId, {
			rating: Number(rating.value),
			comment: normalizeComment(comment.value),
		});
		rating.value = 5;
		comment.value = '';
		await refresh(props.movieId);
	} catch (err: any) {
		actionErrorMessage.value = getFriendlyApiErrorMessage(err, { context: 'review' });
	} finally {
		actionMessage.value = null;
		isSubmitting.value = false;
	}
}

function startEditing() {
	const r = userReview.value;
	if (!r) return;
	isEditing.value = true;
	rating.value = r.rating;
	comment.value = r.comment ?? '';
}

function cancelEditing() {
	isEditing.value = false;
	const r = userReview.value;
	if (r) {
		rating.value = r.rating;
		comment.value = r.comment ?? '';
	} else {
		rating.value = 5;
		comment.value = '';
	}
}

async function onUpdateReview() {
	const r = userReview.value;
	if (!r) return;

	actionErrorMessage.value = null;
	actionMessage.value = 'Updating review...';
	isUpdating.value = true;
	try {
		await reviewsApi.updateReview(r.id, {
			rating: Number(rating.value),
			comment: normalizeComment(comment.value),
		});
		isEditing.value = false;
		await refresh(props.movieId);
	} catch (err: any) {
		actionErrorMessage.value = getFriendlyApiErrorMessage(err, { context: 'review' });
	} finally {
		actionMessage.value = null;
		isUpdating.value = false;
	}
}

async function onDeleteReview() {
	const r = userReview.value;
	if (!r) return;

	actionErrorMessage.value = null;
	actionMessage.value = 'Deleting review...';
	isDeleting.value = true;
	try {
		await reviewsApi.deleteReview(r.id);
		isEditing.value = false;
		rating.value = 5;
		comment.value = '';
		await refresh(props.movieId);
	} catch (err: any) {
		actionErrorMessage.value = getFriendlyApiErrorMessage(err, { context: 'review' });
	} finally {
		actionMessage.value = null;
		isDeleting.value = false;
	}
}

watch(
	() => props.movieId,
	async (movieId) => {
		if (!movieId) return;
		await load(movieId);
	},
	{ immediate: true },
);
</script>

<template>
	<section class="page">
		<p v-if="isLoading" class="state">Loading movie...</p>
		<p v-else-if="notFound" class="state">Movie not found.</p>
		<p v-else-if="errorMessage" class="state">{{ errorMessage }}</p>
		<div v-else-if="movie" class="content">
			<header class="header">
				<div>
					<RouterLink class="navLink" to="/">← Back to movies</RouterLink>
				</div>
			</header>

			<section class="card hero">
				<div class="heroMain">
					<div class="posterWrap">
						<img
								v-if="movie.posterUrl && !posterLoadFailed"
							class="posterImg"
							:src="movie.posterUrl"
							:alt="`${movie.title} poster`"
							loading="lazy"
								@error="posterLoadFailed = true"
						/>
						<div v-else class="posterPlaceholder muted">Poster unavailable</div>
					</div>

					<div class="heroInfo">
						<div class="heroTitleRow">
							<div class="heroTitleWrap">
								<h1 class="title">
									{{ movie.title }}
									<span v-if="movie.releaseYear" class="year muted">({{ movie.releaseYear }})</span>
								</h1>
							</div>

							<div v-if="canEditMovie" class="actions heroOwnerActions">
								<button
									type="button"
									class="btnSm"
									:disabled="isDeletingMovie"
									@click="isEditOpen = true"
								>
									Edit
								</button>
								<button
									type="button"
									class="btnSm btnDangerOutline"
									:disabled="isDeletingMovie"
									@click="onDeleteMovie"
								>
									{{ isDeletingMovie ? 'Deleting…' : 'Delete' }}
								</button>
							</div>
						</div>
						<p v-if="movie.description" class="desc">{{ movie.description }}</p>
						<p v-else class="desc muted">No description.</p>

						<div class="heroMeta">
							<div class="metaItem">
								<span class="metaLabel">Owner</span>
								<span class="metaValue">{{ movie.owner.email }}</span>
							</div>
							<div class="metaItem">
								<span class="metaLabel">Reviews</span>
								<span class="metaValue">{{ movie.reviewCount }}</span>
							</div>
							<div v-if="movie.averageRating !== null" class="metaItem">
								<span class="metaLabel">Average rating</span>
								<span class="metaValue metaRating">
									<StarRating :value="movie.averageRating" readonly label="Average rating" />
									<span class="muted">{{ formatAverageRating(movie.averageRating) }}</span>
								</span>
							</div>
							<div class="metaItem">
								<span class="metaLabel">Created</span>
								<span class="metaValue">{{ formatDate(movie.createdAt) }}</span>
							</div>
						</div>

					</div>
				</div>
			</section>

			<EditMovieModal
				v-if="isEditOpen && movie"
				:movie="movie"
				@close="isEditOpen = false"
				@saved="
					() => {
						isEditOpen = false;
						refresh(props.movieId);
					}
				"
			/>

			<section v-if="movie.trailerUrl" class="card trailer">
				<h2 class="trailerTitle">Trailer</h2>

				<div v-if="trailerEmbedUrl" class="trailerFrame">
					<iframe
						:src="trailerEmbedUrl"
						title="Trailer"
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					/>
				</div>

				<p v-else class="trailerLink">
					<a :href="movie.trailerUrl" target="_blank" rel="noreferrer">Open trailer</a>
				</p>
			</section>

			<p v-if="actionMessage" class="state">{{ actionMessage }}</p>
			<p v-if="actionErrorMessage" class="state">{{ actionErrorMessage }}</p>

			<section class="reviews">
				<h2 class="reviewsTitle">Reviews</h2>

				<p v-if="!hasReviews" class="state">No reviews yet.</p>

				<ul v-else class="reviewList">
					<li v-for="review in reviews" :key="review.id" class="card reviewItem">
						<div class="reviewTop">
								<span class="reviewRating">
									<strong>Rating:</strong>
									<StarRating :value="review.rating" readonly label="Review rating" />
									<span class="muted">{{ review.rating }}/5</span>
								<span v-if="currentUserId && review.user.id === currentUserId" class="you">
									(You)
								</span>
							</span>
							<span class="muted">{{ formatDate(review.createdAt) }}</span>
						</div>
						<p class="reviewMeta"><strong>User:</strong> {{ review.user.email }}</p>
						<p v-if="review.comment" class="reviewComment">{{ review.comment }}</p>
						<p v-else class="reviewComment muted">No comment.</p>

						<div
							v-if="auth.isAuthenticated && currentUserId && review.user.id === currentUserId"
							class="actions reviewActions"
						>
							<button
								type="button"
								class="btnSm"
								:disabled="isSubmitting || isUpdating || isDeleting"
								@click="isEditing ? cancelEditing() : startEditing()"
							>
								{{ isEditing ? 'Cancel' : 'Edit' }}
							</button>
							<button
								type="button"
								class="btnSm"
								:disabled="isSubmitting || isUpdating || isDeleting"
								@click="onDeleteReview"
							>
								Delete
							</button>
						</div>

						<form
							v-if="auth.isAuthenticated && userReview && isEditing && review.id === userReview.id"
							class="form reviewForm"
							@submit.prevent="onUpdateReview"
						>
							<label class="field">
								<span>Rating</span>
								<StarRating v-model:value="rating" :max="5" label="Rating" />
							</label>
							<label class="field">
								<span>Comment (optional)</span>
								<textarea v-model="comment" rows="3" />
							</label>
							<button type="submit" class="btnPrimary" :disabled="isUpdating || isDeleting">
								Save
							</button>
						</form>
					</li>
				</ul>
			</section>

			<section v-if="canAddReview" class="card addReview">
				<h2 class="reviewsTitle">Add your review</h2>
				<form class="form reviewForm" @submit.prevent="onSubmitReview">
					<label class="field">
						<span>Rating</span>
						<StarRating v-model:value="rating" :max="5" label="Rating" />
					</label>
					<label class="field">
						<span>Comment (optional)</span>
						<textarea v-model="comment" rows="3" />
					</label>
					<button
						type="submit"
						class="btnPrimary"
						:disabled="isSubmitting || isUpdating || isDeleting"
					>
						Submit
					</button>
				</form>
			</section>
		</div>
	</section>
</template>

<style scoped>

.header {
	margin-bottom: 12px;
}

.hero {
	padding: 14px;
	margin-bottom: 16px;
}

.heroMain {
	display: flex;
	gap: 14px;
	align-items: flex-start;
}

@media (max-width: 520px) {
	.heroMain {
		flex-direction: column;
	}

	.posterWrap {
		align-self: center;
	}
}

.heroInfo {
	flex: 1;
	min-width: 0;
}

.posterImg,
.posterPlaceholder {
	width: 160px;
	height: 240px;
	border-radius: var(--radius-sm);
	border: 1px solid var(--border);
}

.posterImg {
	display: block;
	object-fit: cover;
}

.posterPlaceholder {
	display: grid;
	place-items: center;
	text-align: center;
	font-size: 12px;
	padding: 6px;
	font-weight: 700;
	letter-spacing: 0.02em;
	background: var(--hover);
}

.year {
	margin-left: 6px;
	font-size: 16px;
}

.desc {
	margin: 8px 0 0;
	max-width: 70ch;
}

.heroMeta {
	margin-top: 12px;
	display: grid;
	gap: 10px;
}

.heroTitleRow {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.heroTitleWrap {
	min-width: 0;
}

.heroOwnerActions {
	flex: 0 0 auto;
	justify-content: flex-end;
}

.metaItem {
	display: grid;
	gap: 2px;
}

.metaLabel {
	font-size: 12px;
	opacity: 0.7;
}

.metaValue {
	font-size: 14px;
	font-weight: 600;
}

.metaRating {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.reviewRating {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.reviewsTitle {
	margin: 0 0 10px;
	font-size: 18px;
}

.trailer {
	margin: 16px 0;
	padding: 14px;
}

.trailerTitle {
	margin: 0 0 10px;
	font-size: 18px;
}

.trailerFrame {
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	aspect-ratio: 16 / 9;
}

.trailerFrame iframe {
	width: 100%;
	height: 100%;
	border: 0;
	display: block;
}

.trailerLink {
	margin: 0;
}

.reviewList {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: 12px;
}

.reviewItem {
	padding: 12px;
}

.reviewTop {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.reviewMeta {
	margin: 8px 0 0;
}

.reviewComment {
	margin: 8px 0 0;
}


.reviewActions {
	margin-top: 10px;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	align-items: center;
}

.reviewForm {
	margin-top: 10px;
}

.addReview {
	margin-top: 16px;
	padding: 14px;
}

.you {
	margin-left: 6px;
	opacity: 0.7;
}

.muted {
	opacity: 0.7;
}
</style>
