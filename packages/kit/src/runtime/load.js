/**
 * @param {import('types').LoadOutput | void} loaded
 * @returns {import('types').NormalizedLoadOutput}
 */
export function normalize(loaded) {
	if (!loaded) {
		return {};
	}

	// TODO remove for 1.0
	// @ts-expect-error
	if (loaded.fallthrough) {
		throw new Error(
			'fallthrough is no longer supported. Use matchers instead: https://kit.svelte.dev/docs/routing#advanced-routing-matching'
		);
	}

	// TODO remove for 1.0
	if ('maxage' in loaded) {
		throw new Error('maxage should be replaced with cache: { maxage }');
	}

	const has_error_status =
		loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
	if (loaded.error || has_error_status) {
		const status = loaded.status;

		if (!loaded.error && has_error_status) {
			return {
				status: status || 500,
				error: new Error(`${status}`)
			};
		}

		const error = typeof loaded.error === 'string' ? new Error(loaded.error) : loaded.error;

		if (!(error instanceof Error)) {
			return {
				status: 500,
				error: new Error(
					`"error" property returned from load() must be a string or instance of Error, received type "${typeof error}"`
				)
			};
		}

		if (!status || status < 400 || status > 599) {
			console.warn('"error" returned from load() without a valid status code — defaulting to 500');
			return { status: 500, error };
		}

		return { status, error };
	}

	if (loaded.redirect) {
		if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
			throw new Error(
				'"redirect" property returned from load() must be accompanied by a 3xx status code'
			);
		}

		if (typeof loaded.redirect !== 'string') {
			throw new Error('"redirect" property returned from load() must be a string');
		}
	}

	if (loaded.dependencies) {
		if (
			!Array.isArray(loaded.dependencies) ||
			loaded.dependencies.some((dep) => typeof dep !== 'string')
		) {
			throw new Error('"dependencies" property returned from load() must be of type string[]');
		}
	}

	// TODO remove before 1.0
	if (/** @type {any} */ (loaded).context) {
		throw new Error(
			'You are returning "context" from a load function. ' +
				'"context" was renamed to "stuff", please adjust your code accordingly.'
		);
	}

	return /** @type {import('types').NormalizedLoadOutput} */ (loaded);
}
