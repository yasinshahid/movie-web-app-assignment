import { http } from './http';

export type MovieListItem = {
	id: string;
	title: string;
	description: string | null;
	posterUrl: string | null;
	trailerUrl: string | null;
	releaseYear: number | null;
	owner: { id: string; email: string };
	reviewCount: number;
	averageRating: number | null;
	createdAt: string;
	updatedAt: string;
};

export type MoviesListResponse = {
	items: MovieListItem[];
	page: number;
	pageSize: number;
	total: number;
};

export type GetMovieResponse = {
	movie: MovieListItem;
};

export type CreateMovieResponse = {
	movie: MovieListItem;
};

export type UpdateMovieResponse = {
	movie: MovieListItem;
};

export async function listMovies(params?: {
	query?: string;
	sort?: 'recent' | 'reviewCount';
	page?: number;
	pageSize?: number;
}) {
	const res = await http.get('/movies', { params });
	return res.data as MoviesListResponse;
}

export async function getMovie(movieId: string) {
	const res = await http.get(`/movies/${movieId}`);
	return res.data as GetMovieResponse;
}

export async function createMovie(input: {
	title: string;
	description?: string | null;
	posterUrl?: string | null;
	trailerUrl?: string | null;
	releaseYear?: number | null;
}) {
	const res = await http.post('/movies', input);
	return res.data as CreateMovieResponse;
}

export async function updateMovie(
	movieId: string,
	input: {
		title?: string;
		description?: string | null;
		posterUrl?: string | null;
		trailerUrl?: string | null;
		releaseYear?: number | null;
	},
) {
	const res = await http.patch(`/movies/${movieId}`, input);
	return res.data as UpdateMovieResponse;
}

export async function deleteMovie(movieId: string) {
	await http.delete(`/movies/${movieId}`);
}
