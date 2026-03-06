# Movie Web App (Hiring Assignment)

## 1) Project Overview
A small movie web app that demonstrates an end-to-end product flow with clean APIs and ownership rules.

Users can:
- Register / log in
- Browse movies (public)
- Search movies by title and sort (recent / most reviewed)
- Create movies (authenticated)
- View a movie’s details and reviews (public)
- Write a review (authenticated, one review per movie)
- Edit/delete their own review

## 2) Tech Stack
**Frontend**
- Vue 3
- Vite
- TypeScript

**Backend**
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

**Testing**
- Vitest
- Supertest

## 3) Features
- Authentication (JWT)
- Movie management (create + browse + details)
- Reviews (create + edit/delete own)
- Search by title (`?query=...`)
- Sorting (`?sort=recent|reviewCount`)
- Ownership enforcement (users can only modify their own content)
- API validation (Zod at the request boundary)

## 4) Architecture Overview
High-level flow:

Frontend (Vue) → REST API → Backend (Express) → PostgreSQL

Notes:
- Backend is modular by domain (routes → controllers → services).
- Prisma is the only database access layer.
- JWT bearer auth is used for authenticated endpoints.

## 5) Setup Instructions
### Prerequisites
- Node.js (LTS recommended)
- Docker (recommended for running PostgreSQL locally)

### Clone
```bash
git clone <your-repo-url>
cd movie-web-app-assignment
```

### Start PostgreSQL (Docker)
From the repo root:
```bash
docker compose up -d
```

### Backend
```bash
cd backend
npm install
```

Create `backend/.env` (see Environment Variables section), then run migrations:
```bash
npm run prisma:migrate
```

Start the API:
```bash
npm run dev
```

Health check:
`GET http://localhost:3000/api/health`

### Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://127.0.0.1:3000`.

## 6) Environment Variables
The backend reads variables from `backend/.env`.

Required:
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret used to sign/verify JWTs

Optional:
- `PORT` – backend port (defaults to `3000`)

Example `backend/.env`:
```env
PORT=3000
DATABASE_URL=postgresql://movie_web_app:movie_web_app_password@localhost:5432/movie_web_app?schema=public
JWT_SECRET=replace-with-a-long-random-string
```

## 7) Running Tests
Backend integration tests:
```bash
cd backend
npm test
```

## 8) API Overview
Base URL: `/api`

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (auth)

**Movies**
- `GET /api/movies` (public) – supports `query`, `sort`, `page`, `pageSize`
- `GET /api/movies/:movieId` (public)
- `POST /api/movies` (auth)
- `PATCH /api/movies/:movieId` (auth, owner)
- `DELETE /api/movies/:movieId` (auth, owner)

**Reviews**
- `GET /api/movies/:movieId/reviews` (public)
- `POST /api/movies/:movieId/reviews` (auth, one per movie)
- `PATCH /api/reviews/:reviewId` (auth, owner)
- `DELETE /api/reviews/:reviewId` (auth, owner)

## 9) Screenshots
- Movies list
	- _TODO: add screenshot_
- Movie details
	- _TODO: add screenshot_
- Reviews
	- _TODO: add screenshot_
- Create movie
	- _TODO: add screenshot_

## 10) Future Improvements
- Pagination UX improvements (persist query/sort/page in URL)
- Small UI polish (error presentation, consistent empty states)
- Basic caching for list/detail requests