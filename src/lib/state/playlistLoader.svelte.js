const MAX_FAILURES = 6;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Playlists being loaded right now. This outlives page changes, so loading carries on while you
 * play. Each entry is the playlist as last reported, plus `running` and `error` ('login' | 'failed').
 */
export const loading = $state({});

export const keyOf = (source, id) => `${source}:${id}`;

/** Keeps asking for the next stretch until the whole playlist is in. */
export async function loadPlaylist(source, id, { update = false, known = null } = {}) {
	const key = keyOf(source, id);
	if (loading[key]?.running) return;
	loading[key] = { ...known, source, id, running: true, error: null };
	let failures = 0;
	let again = update;
	while (loading[key].running) {
		try {
			const response = await fetch(`/api/games/playlist/${source}/${id}/load`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ update: again })
			});
			if (response.status === 401) {
				loading[key] = { ...loading[key], running: false, error: 'login' };
				return;
			}
			if (response.status === 404 || response.status === 400) {
				loading[key] = { ...loading[key], running: false, error: 'failed' };
				return;
			}
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.playlist) {
				failures += 1;
				if (failures >= MAX_FAILURES) {
					loading[key] = { ...loading[key], running: false, error: 'failed' };
					return;
				}
				await sleep(Math.max(result?.retryAfter ?? 0, failures) * 1000);
				continue;
			}
			failures = 0;
			again = false;
			const done = result.playlist.status === 'ready';
			loading[key] = { ...result.playlist, running: !done, error: null };
		} catch {
			failures += 1;
			if (failures >= MAX_FAILURES) {
				loading[key] = { ...loading[key], running: false, error: 'failed' };
				return;
			}
			await sleep(failures * 1000);
		}
	}
}
