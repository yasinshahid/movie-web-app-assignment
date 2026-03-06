import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

type Env = {
	PORT: number;
	DATABASE_URL?: string;
	JWT_SECRET?: string;
};

const portRaw = process.env.PORT;
const port = portRaw ? Number(portRaw) : 3000;

export const env: Env = {
	PORT: Number.isFinite(port) ? port : 3000,
	DATABASE_URL: process.env.DATABASE_URL,
	JWT_SECRET: process.env.JWT_SECRET,
};
