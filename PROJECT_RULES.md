# PROJECT_RULES

## 1) Project purpose
Build a small, recruiter-friendly **Movie Web App** that demonstrates end-to-end product thinking with a clean, maintainable codebase:
- Guest browsing (no login required to read/search/rank)
- Authentication for creating and managing content
- Movies + reviews, search by title, and ranking movies by review count
- Clear ownership rules (users can only modify their own content)

Success criteria: predictable APIs, sensible validation, consistent error handling, and a UI that is simple and easy to review.

---

## 2) Required stack
**Frontend**
- Vue 3 + Vite
- Vue Router
- Pinia (only where state truly needs to be global)
- Axios
- Custom CSS (keep it minimal and consistent)

**Backend**
- Node.js + Express
- PostgreSQL
- Prisma ORM

---

## 3) Architecture principles
- Prefer **clarity over cleverness**. A reviewer should understand the flow in minutes.
- Keep the backend **layered**: routes → controllers → services → database (Prisma).
- Keep functions small, cohesive, and testable.
- Centralize cross-cutting concerns: auth, error handling, request validation.
- Avoid “future-proofing” (queues, microservices, event buses, CQRS, etc.).

---

## 4) Backend rules
**Folder structure (suggested)**
- `src/app.ts` (express app wiring)
- `src/server.ts` (listen/boot)
- `src/routes/*` (HTTP route definitions)
- `src/controllers/*` (HTTP in/out only)
- `src/services/*` (business logic)
- `src/validations/*` (request DTO schemas)
- `src/middleware/*` (auth, validation, error handler)
- `src/lib/*` (prisma client, config, helpers)
- `prisma/schema.prisma`

**Layer responsibilities**
- Routes: map URLs + HTTP verbs to controller functions.
- Controllers: parse request, call service, return response. No database calls.
- Services: enforce business rules, ownership checks, database operations via Prisma.
- Middleware: auth/session, request validation, error conversion.

**Error handling**
- Use one error format across the API.
- No leaking stack traces or Prisma internals in production responses.
- Prefer domain errors with explicit status codes (e.g., 400/401/403/404/409).

**Database rules**
- Prisma is the only DB access layer.
- Migrations are required (no “manual SQL only” approach).
- Enforce constraints at the DB level where appropriate (uniqueness, foreign keys).

---

## 5) Frontend rules
- Vue Router handles navigation; keep routes readable.
- Pinia only for:
  - auth/session state
  - shared cached data that multiple views depend on
- Prefer component local state for view-specific concerns.
- Axios:
  - one configured instance (base URL, credentials/token, interceptors for 401)
  - API functions grouped by domain (movies, reviews, auth)
- Keep UI simple: list pages + detail page + forms. No extra pages beyond requirements.
- Custom CSS:
  - keep styling consistent
  - avoid introducing large CSS frameworks

---

## 6) API and validation rules
**General API rules**
- REST-style routes, predictable naming.
- Use plural nouns (`/movies`, `/reviews`).
- Pagination parameters are allowed if needed, but keep defaults sensible.

**Validation**
- Validate all request inputs at the boundary (middleware) before hitting services.
- Validate:
  - types, required fields
  - min/max string lengths
  - numeric ranges (rating)
  - IDs format (UUID if used)
- Return 400 with a structured list of field errors.

**Movies**
- `title` must be **unique** (case-insensitive uniqueness is preferred; if not implemented, document the chosen behavior).
- Search by title uses a query parameter, e.g. `GET /movies?query=...`.
- Ranking endpoint (or query option) returns movies ordered by **review count**.

**Reviews**
- Rating must be validated (e.g., integer 1–5).
- A review belongs to exactly one movie and one user.

---

## 7) Auth and ownership rules
**Auth**
- Guest users can browse/search/rank and view movie details + reviews.
- Authenticated users can create/update/delete:
  - their own movies
  - their own reviews

**Ownership**
- Users can only edit/delete resources they own.
- Ownership must be enforced in the service layer (not only on the client).
- Unauthorized access:
  - 401 when not logged in
  - 403 when logged in but not owner

**Implementation expectations**
- Authentication can be token-based (JWT) or session-based; choose one and keep it simple.
- Passwords must be hashed (never store plaintext).

---

## 8) Testing philosophy
Keep tests **small and valuable**, not exhaustive.
- Backend:
  - unit tests for services (ownership rules, uniqueness conflicts, ranking logic)
  - a small number of API integration tests for critical flows (auth, CRUD)
- Frontend:
  - component tests only if they add clear value (forms/validation behaviors)

Do not set up complex test infrastructure. Prioritize readability and signal over coverage.

---

## 9) What not to build
Do **not** add any of the following unless explicitly required:
- admin panels, roles/permissions beyond “owner vs not owner”
- social features (follows, likes, comments)
- recommendations, ML, “similar movies”
- real-time updates, websockets
- microservices, message queues
- multi-database setups
- elaborate design systems or UI libraries
- complicated caching layers

Docker and broader test coverage can be added later, but keep the initial solution minimal.

---

## 10) Coding style and naming rules
**General**
- Use TypeScript for both frontend and backend.
- Use explicit names: `createMovie`, `listMovies`, `updateReview`.
- Keep files small; split by domain when a file grows.

**Backend naming**
- Routes: `movies.routes.ts`, `reviews.routes.ts`, `auth.routes.ts`
- Controllers: `movies.controller.ts`
- Services: `movies.service.ts`
- Validations: `movies.validation.ts`
- Middleware: `requireAuth.ts`, `validateRequest.ts`, `errorHandler.ts`

**API responses**
- Keep consistent shapes for success and error responses.
- Dates should be ISO strings.

**Prisma**
- Model names are singular and PascalCase (`User`, `Movie`, `Review`).
- Table/field naming follows Prisma conventions unless a reason exists to customize.

**Frontend naming**
- Views/pages in `src/pages/*`.
- Reusable components in `src/components/*`.
- API clients in `src/api/*`.
- Pinia stores in `src/stores/*`.

**Linting/formatting**
- Use an automatic formatter and keep it consistent across the repo.
- Prefer simple, readable code over clever one-liners.
