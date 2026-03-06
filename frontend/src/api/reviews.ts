import { http } from './http';

export type ReviewItem = {
	id: string;
	rating: number;
	comment: string | null;
	user: { id: string; email: string };
	createdAt: string;
	updatedAt: string;
};

export type MovieReviewsListResponse = {
	items: ReviewItem[];
	page: number;
	pageSize: number;
	total: number;
};

export type CreateReviewResponse = {
	review: ReviewItem;
};

export type UpdateReviewResponse = {
	review: ReviewItem;
};

export async function listMovieReviews(
	movieId: string,
	params?: { page?: number; pageSize?: number },
) {
	const res = await http.get(`/movies/${movieId}/reviews`, { params });
	return res.data as MovieReviewsListResponse;
}

export async function createMovieReview(
	movieId: string,
	input: { rating: number; comment?: string | null },
) {
	const res = await http.post(`/movies/${movieId}/reviews`, input);
	return res.data as CreateReviewResponse;
}

export async function updateReview(
	reviewId: string,
	input: { rating: number; comment?: string | null },
) {
	const res = await http.patch(`/reviews/${reviewId}`, input);
	return res.data as UpdateReviewResponse;
}

export async function deleteReview(reviewId: string) {
	await http.delete(`/reviews/${reviewId}`);
}