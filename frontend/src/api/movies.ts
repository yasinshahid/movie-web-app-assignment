import { http } from './http';

export type MovieListItem = {
	id: string;
	title: string;
	description: string | null;
	owner: { id: string; email: string };
	reviewCount: number;
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

export async function createMovie(input: { title: string; description?: string | null }) {
	const res = await http.post('/movies', input);
	return res.data as CreateMovieResponse;
}
