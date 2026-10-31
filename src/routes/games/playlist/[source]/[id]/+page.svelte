<script>
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import ListenGame from '#lib/components/ListenGame.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { createMatcher } from '#lib/games/fuzzy.js';
	import { keyOf, loadPlaylist, loading } from '#lib/state/playlistLoader.svelte.js';
	import { nextRound, recordScore, rememberRound } from '#lib/state/playlists.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const MIN_SONGS = 5;
	const QUICK_SONGS = 10;

	let source = $derived(page.params.source);
	let id = $derived(page.params.id);
	let seed = $derived(page.url.searchParams.get('seed'));
	let deal = $derived(Number(page.url.searchParams.get('deal') ?? 0));
	let size = $derived(Number(page.url.searchParams.get('size')));
	let mode = $derived(page.url.searchParams.get('mode'));
	let job = $derived(loading[keyOf(source, id)]);
	let waiting = $state(false);
	let failed = $state(false);

	const query = (values) => {
		const params = new URLSearchParams({
			seed: values.seed,
			deal: `${values.deal}`,
			size: `${values.size}`
		});
		if (values.mode) params.set('mode', values.mode);
		return `?${params}`;
	};

	let api = $derived(`/api/games/playlist/${source}/${id}${query({ seed, deal, size, mode })}`);
	// The next round includes whatever has loaded since this one began.
	let moreSize = $derived(Math.max(job?.found ?? 0, size));
	let moreHref = $derived(query({ seed, deal: deal + 1, size: moreSize, mode }));

	/** A plain link says only which playlist, so settle which round it is before playing. */
	async function start() {
		failed = false;
		try {
			let response = await fetch(`/api/games/playlist/${source}/${id}`);
			if (response.status === 404) {
				response = await fetch('/api/games/playlist', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						link:
							source === 'spotify'
								? `spotify:playlist:${id}`
								: `https://www.deezer.com/playlist/${id}`
					})
				});
			}
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const { playlist } = await response.json();
			if (playlist.status === 'loading') loadPlaylist(source, id, { known: playlist });
			const needed = mode === 'quick' ? QUICK_SONGS : MIN_SONGS;
			if (playlist.found < needed) {
				waiting = true;
				return;
			}
			waiting = false;
			if (seed && size) return;
			// A quick round is a one-off: it doesn't count as the playlist's next five.
			const round =
				mode === 'quick'
					? { seed: Math.random().toString(36).slice(2, 10), deal: 0, size: null }
					: nextRound(source, id);
			await goto(query({ ...round, size: round.size ?? playlist.found, mode }), {
				replace: true
			});
		} catch {
			failed = true;
		}
	}

	onMount(start);

	// Songs are still arriving: the game can start as soon as there are enough of them.
	$effect(() => {
		if (!waiting) return;
		const needed = mode === 'quick' ? QUICK_SONGS : MIN_SONGS;
		if ((job?.found ?? 0) >= needed || job?.status === 'ready') start();
	});

	function searcher(tracks) {
		const match = createMatcher(
			tracks,
			(track) => track.title,
			(track) => track.artist
		);
		return (text) =>
			match(text).map((track) => ({ id: track.id, title: track.title, label: track.artist }));
	}

	const describe = (answer) => ({
		heading: answer.title,
		note: answer.artist,
		image: answer.artwork
	});
</script>

{#snippet progress()}
	{#if job?.running && job.total}Loading {job.processed} of {job.total}{/if}
{/snippet}

{#if failed}
	<GameShell title="Your playlist" back="/games/playlist" backLabel="Your playlists">
		<EmptyState title="We couldn't open this playlist">
			<p>It may be private, or the service may be busy.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	</GameShell>
{:else if waiting}
	<GameShell title="Your playlist" back="/games/playlist" backLabel="Your playlists">
		<EmptyState title={job?.status === 'ready' ? 'Not enough songs' : 'Getting the songs ready'}>
			{#if job?.status === 'ready'}
				<p>We found {job.found} songs on Deezer and this game needs more.</p>
				<a class="btn" href="/games/playlist">Back to your playlists</a>
			{:else if job?.error === 'login'}
				<p>Log in to Spotify to finish loading this playlist.</p>
				<a class="btn btn-primary" href="/api/spotify/login" data-sveltekit-reload>Log in</a>
			{:else}
				<p>Loaded {job?.processed ?? 0} of {job?.total ?? '…'}. The game starts by itself.</p>
			{/if}
		</EmptyState>
	</GameShell>
{:else if seed && size}
	{#key api}
		<ListenGame
			game="playlist"
			title="Your playlist"
			lead="Songs from this playlist, from easy to legend."
			closeNote="Right artist, though."
			{api}
			daily={false}
			back="/games/playlist"
			backLabel="Your playlists"
			shareUrl={page.url.href}
			{moreHref}
			moreLabel={mode === 'quick' ? 'Next quick round' : 'Next 5 songs'}
			{describe}
			{progress}
			onready={(puzzle) => {
				if (mode !== 'quick') {
					rememberRound({ source, id, title: puzzle.title, cover: puzzle.cover, seed, deal, size });
				}
			}}
			onfinish={(score) => {
				if (mode !== 'quick') recordScore(source, id, seed, deal, score);
			}}
		>
			{#snippet picker(submit, puzzle)}
				<MovieGuess
					onpick={submit}
					placeholder="Song or artist"
					label="Guess the song"
					local={searcher(puzzle.tracks)}
					empty="No song in this playlist matches that."
					up
				/>
			{/snippet}
		</ListenGame>
	{/key}
{/if}
