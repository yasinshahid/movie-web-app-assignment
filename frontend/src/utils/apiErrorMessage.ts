type BackendFieldError = {
	field?: string;
	message?: string;
};

type BackendError = {
	code?: string;
	message?: string;
	fields?: BackendFieldError[];
};

type ErrorContext = 'movie-create' | 'review';

type Options = {
	context?: ErrorContext;
	fallbackMessage?: string;
};

function getBackendError(err: any): BackendError | null {
	return (err?.response?.data?.error as BackendError | undefined) ?? null;
}

function getFirstFieldError(backendError: BackendError | null): BackendFieldError | null {
	if (!backendError) return null;
	if (!Array.isArray(backendError.fields) || backendError.fields.length === 0) return null;
	return backendError.fields[0] ?? null;
}

function friendlyMessageForField(context: ErrorContext, fieldError: BackendFieldError): string | null {
	const field = fieldError.field;
	const message = fieldError.message ?? '';

	if (context === 'movie-create') {
		if (field === 'body.title') {
			if (/required/i.test(message) || /too\s+small/i.test(message) || /at\s+least\s+1\b/i.test(message) || /\b>=\s*1\b/.test(message)) {
				return 'Title is required.';
			}
			if (/too\s+big/i.test(message) || /at\s+most\s+200\b/i.test(message) || /\b<=\s*200\b/.test(message)) {
				return 'Title must be 200 characters or fewer.';
			}
		}
		if (field === 'body.posterUrl') return 'Please enter a valid direct image URL for the poster.';
		if (field === 'body.trailerUrl') return 'Please enter a valid trailer URL.';
		if (field === 'body.releaseYear') return 'Please enter a valid release year.';

		// If backend reports title uniqueness via validation fields, still show the same friendly message.
		if (/title/i.test(field ?? '') && /exist/i.test(message)) return 'Movie title already exists.';
	}

	if (context === 'review') {
		if (field === 'body.rating') return 'Please enter a rating from 1 to 5.';
		if (field === 'body.comment') return 'Please enter a valid comment.';
	}

	return null;
}

export function getFriendlyApiErrorMessage(err: any, options?: Options): string {
	const fallbackMessage = options?.fallbackMessage ?? 'Something went wrong.';
	const context = options?.context;
	const status = err?.response?.status;
	const backendError = getBackendError(err);

	// Network/proxy failures often produce no structured JSON error payload.
	// In those cases, show a clear message instead of a generic fallback.
	if (!backendError) {
		const isAxiosLike = Boolean(err?.isAxiosError) || err?.name === 'AxiosError';
		const message = typeof err?.message === 'string' ? err.message : '';
		if (!err?.response && (isAxiosLike || /network\s+error/i.test(message))) {
			return 'Could not reach the server. Please try again.';
		}
		if (status === 502 || status === 503 || status === 504) {
			return 'Could not reach the server. Please try again.';
		}
	}

	// Context-specific conflict mapping (e.g. unique title).
	if (context === 'movie-create') {
		if (status === 409 || backendError?.code === 'CONFLICT') {
			return 'Movie title already exists.';
		}
	}

	const firstFieldError = getFirstFieldError(backendError);
	if (firstFieldError && context) {
		const mapped = friendlyMessageForField(context, firstFieldError);
		if (mapped) return mapped;
	}

	return backendError?.message ?? fallbackMessage;
}
