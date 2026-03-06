type BackendFieldError = {
	field?: string;
	message?: string;
};

type BackendError = {
	code?: string;
	message?: string;
	fields?: BackendFieldError[];
};

function getBackendError(err: any): BackendError | null {
	return (err?.response?.data?.error as BackendError | undefined) ?? null;
}

function looksLikeMinLength8(message: string): boolean {
	return /expected\s+string\s+to\s+have\s+>=\s*8\s+characters/i.test(message) || /\b>=\s*8\b/.test(message) || /at\s+least\s+8\b/i.test(message) || /minimum\s+8\b/i.test(message);
}

export function getFriendlyAuthErrorMessage(err: any, fallbackMessage: string): string {
	const backendError = getBackendError(err);

	if (backendError?.code === 'VALIDATION_ERROR' && Array.isArray(backendError.fields) && backendError.fields.length > 0) {
		const firstField = backendError.fields[0];
		const field = firstField?.field;
		const message = firstField?.message ?? '';

		if (field === 'body.email') {
			return 'Please enter a valid email address.';
		}

		if (field === 'body.password' && looksLikeMinLength8(message)) {
			return 'Password must be at least 8 characters long.';
		}
	}

	return backendError?.message ?? fallbackMessage;
}
