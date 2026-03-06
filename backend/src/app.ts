import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './modules/auth/auth.routes';
import moviesRoutes from './modules/movies/movies.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import { errorHandler } from './middlewares/errorHandler';

type CreateAppOptions = {
	requestLogger?: boolean;
};

export function createApp(options: CreateAppOptions = {}) {
	const app = express();

	app.use(helmet());
	app.use(cors());
	app.use(express.json());

	if (options.requestLogger !== false) {
		app.use(morgan('dev'));
	}

	app.get('/api/health', (_req, res) => {
		res.status(200).json({ status: 'ok' });
	});

	app.use('/api/auth', authRoutes);
	app.use('/api/movies', moviesRoutes);
	app.use('/api', reviewsRoutes);

	app.use(errorHandler);

	return app;
}
