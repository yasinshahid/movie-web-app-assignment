<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import * as moviesApi from '../api/movies';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const searchInput = ref('');
const activeQuery = ref<string | undefined>(undefined);
const sort = ref<'recent' | 'reviewCount'>('recent');

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const items = ref<moviesApi.MovieListItem[]>([]);
const posterLoadErrorById = ref<Record<string, boolean>>({});

const hasResults = computed(() => items.value.length > 0);

function formatDate(iso: string) {
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

async function fetchMovies() {
	isLoading.value = true;
	errorMessage.value = null;
	try {
		const res = await moviesApi.listMovies({
			query: activeQuery.value,
			sort: sort.value,
			page: 1,
			pageSize: 20,
		});
		items.value = res.items;
		posterLoadErrorById.value = {};
	} catch (err: any) {
		errorMessage.value = err?.response?.data?.error?.message ?? 'Failed to load movies';
	} finally {
		isLoading.value = false;
	}
}

function onPosterError(movieId: string) {
	posterLoadErrorById.value[movieId] = true;
}

async function onSearchSubmit() {
	const q = searchInput.value.trim();
	activeQuery.value = q.length > 0 ? q : undefined;
	await fetchMovies();
}

watch(sort, async () => {
	await fetchMovies();
});

onMounted(async () => {
	await fetchMovies();
});
</script>

<template>
	<section class="page">
		<section class="card top">
			<header class="header">
				<div>
					<h1 class="title">Movies</h1>
					<p class="subtitle">Browse movies, then jump into details and reviews.</p>
				</div>

				<RouterLink v-if="auth.isAuthenticated" class="btnPrimary create" to="/movies/new">
					Create Movie
				</RouterLink>
			</header>

			<div class="controls">
				<form class="search" @submit.prevent="onSearchSubmit">
					<input
						v-model="searchInput"
						type="search"
						placeholder="Search by title"
						aria-label="Search by title"
					/>
					<button type="submit" :disabled="isLoading">Search</button>
				</form>

				<label class="sort">
					<span>Sort</span>
					<select v-model="sort">
						<option value="recent">Recent</option>
						<option value="reviewCount">Most reviewed</option>
					</select>
				</label>
			</div>
		</section>

		<p v-if="isLoading" class="state">Loading movies...</p>
		<p v-else-if="errorMessage" class="state">{{ errorMessage }}</p>
		<p v-else-if="!hasResults" class="state">No movies found.</p>

		<ul v-else class="list">
			<li v-for="movie in items" :key="movie.id">
				<RouterLink class="card cardLink movieCard" :to="`/movies/${movie.id}`">
					<div class="row">
						<div class="posterWrap">
							<img
								v-if="movie.posterUrl && !posterLoadErrorById[movie.id]"
								class="posterImg"
								:src="movie.posterUrl"
								:alt="`${movie.title} poster`"
								loading="lazy"
								@error="onPosterError(movie.id)"
							/>
							<div v-else class="posterPlaceholder muted">Poster unavailable</div>
						</div>

						<div class="info">
							<div class="itemTop">
								<h2 class="itemTitle">
									{{ movie.title }}
									<span v-if="movie.releaseYear" class="year muted">({{ movie.releaseYear }})</span>
								</h2>
								<span class="badge">{{ movie.reviewCount }} reviews</span>
							</div>
							<p v-if="movie.description" class="desc">{{ movie.description }}</p>
							<p v-else class="desc muted">No description.</p>
							<div class="meta">
								<p><strong>Owner:</strong> {{ movie.owner.email }}</p>
								<p><strong>Created:</strong> {{ formatDate(movie.createdAt) }}</p>
							</div>
						</div>
					</div>
				</RouterLink>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.header {
	display: flex;
	align-items: center;
	gap: 16px;
	justify-content: space-between;
	margin-bottom: 12px;
}

.top {
	padding: 16px;
	margin-bottom: 16px;
}

.create {
	padding: 10px 12px;
}

.controls {
	display: flex;
	gap: 16px;
	align-items: flex-end;
	flex-wrap: wrap;
	margin: 0;
}

.search {
	display: flex;
	gap: 8px;
	flex: 1;
	min-width: 280px;
}

.sort {
	display: grid;
	gap: 6px;
	min-width: 200px;
}

.list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: 12px;
}

.movieCard {
	padding: 14px;
}

.row {
	display: flex;
	gap: 12px;
	align-items: flex-start;
}

.posterWrap {
	flex: 0 0 auto;
}

.posterImg,
.posterPlaceholder {
	width: 76px;
	height: 114px;
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
	font-weight: 700;
	letter-spacing: 0.02em;
	padding: 6px;
	background: var(--hover);
}

.info {
	flex: 1;
	min-width: 0;
}

.itemTop {
	display: flex;
	gap: 12px;
	align-items: baseline;
	justify-content: space-between;
}

.itemTitle {
	margin: 0;
	font-size: 18px;
	line-height: 1.25;
}

.year {
	margin-left: 6px;
	font-size: 14px;
}

.badge {
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 2px 8px;
	font-size: 12px;
	opacity: 0.9;
}

.desc {
	margin: 8px 0 0;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.meta {
	margin-top: 10px;
	display: grid;
	gap: 4px;
	opacity: 0.85;
	font-size: 13px;
}

.meta p {
	margin: 0;
}

.muted {
	opacity: 0.7;
}
</style>
