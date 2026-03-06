import { Router } from 'express';

import { requireAuth } from '../../middlewares/requireAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import * as controller from './movies.controller';
import {
	createMovieSchema,
	listMoviesSchema,
	movieIdParamSchema,
	updateMovieSchema,
} from './movies.validation';

const router = Router();

router.get('/', validateRequest(listMoviesSchema), controller.listMovies);
router.get('/:movieId', validateRequest(movieIdParamSchema), controller.getMovie);

router.post('/', requireAuth, validateRequest(createMovieSchema), controller.createMovie);
router.patch(
	'/:movieId',
	requireAuth,
	validateRequest(updateMovieSchema),
	controller.updateMovie,
);
router.delete('/:movieId', requireAuth, validateRequest(movieIdParamSchema), controller.deleteMovie);

export default router;
