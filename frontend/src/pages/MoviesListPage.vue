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
	} catch (err: any) {
		errorMessage.value = err?.response?.data?.error?.message ?? 'Failed to load movies';
	} finally {
		isLoading.value = false;
	}
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
		<header class="header">
			<div>
				<h1 class="title">Movies</h1>
				<p class="subtitle">Browse movies (search and sort supported).</p>
			</div>

			<RouterLink v-if="auth.isAuthenticated" class="create cardLink" to="/movies/new">
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

		<p v-if="isLoading" class="state">Loading movies...</p>
		<p v-else-if="errorMessage" class="state">{{ errorMessage }}</p>
		<p v-else-if="!hasResults" class="state">No movies found.</p>

		<ul v-else class="list">
			<li v-for="movie in items" :key="movie.id">
				<RouterLink class="card cardLink" :to="`/movies/${movie.id}`">
					<div class="itemTop">
						<h2 class="itemTitle">{{ movie.title }}</h2>
						<span class="badge">{{ movie.reviewCount }} reviews</span>
					</div>
					<p v-if="movie.description" class="desc">{{ movie.description }}</p>
					<p v-else class="desc muted">No description.</p>
					<div class="meta">
						<p><strong>Owner:</strong> {{ movie.owner.email }}</p>
						<p><strong>Created:</strong> {{ formatDate(movie.createdAt) }}</p>
					</div>
				</RouterLink>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.header {
	display: flex;
	align-items: flex-start;
	gap: 16px;
	justify-content: space-between;
	margin-bottom: 16px;
}

.create {
	align-self: center;
	border: 1px solid var(--border);
	padding: 10px 12px;
	border-radius: var(--radius-sm);
}

.controls {
	display: flex;
	gap: 16px;
	align-items: flex-end;
	flex-wrap: wrap;
	margin-bottom: 16px;
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
}

.list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: 12px;
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
