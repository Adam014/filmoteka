/**
 * Debounced search against /api/search. Only the newest request can update the results,
 * so a slow early response never overwrites a newer one.
 */
export function createSearch({ type = '', debounceMs = 220 } = {}) {
	let timer;
	let controller;

	const state = $state({ results: [], loading: false, failed: false });

	async function run(query) {
		controller?.abort();
		controller = new AbortController();
		const { signal } = controller;

		state.loading = true;
		state.failed = false;
		try {
			const params = new URLSearchParams({ q: query });
			if (type) params.set('type', type);
			const response = await fetch(`/api/search?${params}`, { signal });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			state.results = (await response.json()).results;
			state.loading = false;
		} catch (error) {
			if (error.name === 'AbortError') return;
			state.results = [];
			state.failed = true;
			state.loading = false;
		}
	}

	return {
		state,
		update(query) {
			clearTimeout(timer);
			timer = setTimeout(() => run(query.trim()), debounceMs);
		},
		now(query) {
			clearTimeout(timer);
			return run(query.trim());
		},
		reset() {
			clearTimeout(timer);
			controller?.abort();
			state.results = [];
			state.loading = false;
			state.failed = false;
		}
	};
}
