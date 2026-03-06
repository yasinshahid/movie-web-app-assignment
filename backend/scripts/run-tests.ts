/* eslint-disable no-console */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function binPath(name: string) {
	const ext = process.platform === 'win32' ? '.cmd' : '';
	return path.resolve(__dirname, '..', 'node_modules', '.bin', `${name}${ext}`);
}

function deriveTestDatabaseUrl(databaseUrl: string) {
	const url = new URL(databaseUrl);
	const dbName = url.pathname.replace(/^\//, '');
	if (!dbName) return null;
	url.pathname = `/${dbName}_test`;
	return url.toString();
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: process.platform === 'win32',
		env,
	});
	if (result.error) {
		console.error(result.error);
		process.exit(1);
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const backendRoot = path.resolve(__dirname, '..');

// Load standard env first (local dev), then optional test env overrides
const envPath = path.resolve(backendRoot, '.env');
if (fs.existsSync(envPath)) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('dotenv').config({ path: envPath });
}

// Optional local env file for tests (not committed)
const envTestPath = path.resolve(backendRoot, '.env.test');
if (fs.existsSync(envTestPath)) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('dotenv').config({ path: envTestPath });
}

const baseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
if (!baseUrl) {
	console.error('Missing DATABASE_URL_TEST (preferred) or DATABASE_URL in environment.');
	console.error(
		'Create backend/.env with DATABASE_URL, and optionally backend/.env.test with DATABASE_URL_TEST.',
	);
	process.exit(1);
}

const testUrl = process.env.DATABASE_URL_TEST || deriveTestDatabaseUrl(baseUrl);
if (!testUrl) {
	console.error('Could not derive test database URL. Please set DATABASE_URL_TEST explicitly.');
	process.exit(1);
}

const env: NodeJS.ProcessEnv = {
	...process.env,
	NODE_ENV: 'test',
	DATABASE_URL: testUrl,
	DATABASE_URL_TEST: testUrl,
};

// Ensure Prisma Client exists (e.g. after a fresh npm ci)
run(binPath('prisma'), ['generate'], env);

// Reset dedicated test database via migrations
run(binPath('prisma'), ['migrate', 'reset', '--force', '--skip-seed', '--skip-generate'], env);

// Run vitest
run(binPath('vitest'), ['run', '--no-file-parallelism'], env);
