import { Router } from 'express';

import { requireAuth } from '../../middlewares/requireAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import * as controller from './reviews.controller';
import {
	createReviewSchema,
	movieIdParamSchema,
	reviewIdParamSchema,
	updateReviewSchema,
} from './reviews.validation';

const router = Router();

// Movie-scoped reviews
router.get(
	'/movies/:movieId/reviews',
	validateRequest(movieIdParamSchema),
	controller.listMovieReviews,
);
router.post(
	'/movies/:movieId/reviews',
	requireAuth,
	validateRequest(createReviewSchema),
	controller.createReview,
);

// Review-scoped operations
router.patch(
	'/reviews/:reviewId',
	requireAuth,
	validateRequest(updateReviewSchema),
	controller.updateReview,
);
router.delete(
	'/reviews/:reviewId',
	requireAuth,
	validateRequest(reviewIdParamSchema),
	controller.deleteReview,
);

export default router;
