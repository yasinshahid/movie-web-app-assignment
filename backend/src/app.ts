import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

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

	return app;
}
