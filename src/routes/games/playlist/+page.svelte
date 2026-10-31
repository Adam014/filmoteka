<script>
	import GameShell from '#lib/components/GameShell.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PlaylistAdd from '#lib/components/PlaylistAdd.svelte';
	import PlaylistTile from '#lib/components/PlaylistTile.svelte';
	import { keyOf, loadPlaylist, loading } from '#lib/state/playlistLoader.svelte.js';
	import { hidePlaylist, readHidden, readPlaylists, showPlaylist } from '#lib/state/playlists.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const MIN_SONGS = 5;
	const QUICK_SONGS = 10;
	const STALE = 30 * 1000;
	const POLL = 5000;
	const LOGIN_NOTES = {
		cancelled: 'The Spotify login was cancelled.',
		failed: "The Spotify login didn't work. Please try again.",
		off: "Spotify login isn't set up on this site yet."
	};
	const MODES = [
		{ id: 'classic', name: 'Classic', blurb: '5 songs, Easy to Legend', tier: 1, need: MIN_SONGS },
		{ id: 'quick', name: 'Quick', blurb: '10 songs, 3 tries each', tier: 3, need: QUICK_SONGS }
	];

	let mode = $state('classic');
	let pending = $state(false);
	let message = $state('');
	let library = $state(null);
	let failed = $state(false);
	let device = $state([]);
	let hidden = $state([]);
	let spotify = $state({ available: false, loggedIn: false });
	let mine = $state(null);
	let mineError = $state('');
	let addDialog = $state();
	let howDialog = $state();

	let chosen = $derived(MODES.find((item) => item.id === mode));
	let loginNote = $derived(LOGIN_NOTES[page.url.searchParams.get('spotify')] ?? '');
	let added = $derived(new Set((library ?? []).map((item) => keyOf(item.source, item.id))));

	/** The library, with this device's scores and whatever is loading right now. */
	let rows = $derived.by(() => {
		if (!library) return [];
		const played = new Map(
			device.map((item, index) => [keyOf(item.source, item.id), { item, index }])
		);
		return library
			.filter((item) => !hidden.includes(keyOf(item.source, item.id)))
			.map((item) => {
				const key = keyOf(item.source, item.id);
				return { ...item, ...loading[key], key, mine: played.get(key) };
			})
			.sort((a, b) => (a.mine?.index ?? Infinity) - (b.mine?.index ?? Infinity));
	});
	let playable = $derived(rows.filter((row) => row.found >= MIN_SONGS));
	let lastPlayed = $derived(playable.find((row) => row.mine));

	const gameHref = (row, id = 'classic') =>
		`/games/playlist/${row.source}/${row.id}${id === 'quick' ? '?mode=quick' : ''}`;
	const tileHref = (row) => (row.found >= chosen.need ? gameHref(row, mode) : undefined);

	function surprise() {
		const row = playable[Math.floor(Math.random() * playable.length)];
		if (row) goto(gameHref(row));
	}

	async function refresh() {
		try {
			const response = await fetch('/api/games/playlist');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const result = await response.json();
			const wasLoggedIn = spotify.loggedIn;
			library = result.playlists;
			spotify = result.spotify;
			failed = false;
			if (spotify.loggedIn && !wasLoggedIn) loadMine();
			resumeStalled();
		} catch {
			if (!library) failed = true;
		}
	}

	/** Whoever opens the page picks up a load that someone left unfinished. */
	function resumeStalled() {
		for (const item of library) {
			const job = loading[keyOf(item.source, item.id)];
			const age = Date.now() - new Date(item.updated_at).getTime();
			if (item.status === 'loading' && !job && age > STALE) {
				loadPlaylist(item.source, item.id, { known: item });
			}
		}
	}

	async function loadMine() {
		mineError = '';
		try {
			const response = await fetch('/api/spotify/playlists');
			if (response.status === 401) {
				spotify = { ...spotify, loggedIn: false };
				return;
			}
			if (response.status === 403) {
				mineError = "Spotify didn't approve this account for this site. Use a link instead.";
				return;
			}
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			mine = await response.json();
		} catch {
			mineError = "Your Spotify playlists didn't load. Please try again.";
		}
	}

	async function logout() {
		await fetch('/api/spotify/logout', { method: 'POST' });
		spotify = { ...spotify, loggedIn: false };
		mine = null;
	}

	/** @returns {Promise<boolean>} Whether the playlist went in. */
	async function add(value) {
		if (pending) return false;
		pending = true;
		message = '';
		try {
			const response = await fetch('/api/games/playlist', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ link: value })
			});
			const result = await response.json();
			if (!response.ok) {
				message = result.message;
				return false;
			}
			const { playlist } = result;
			if (!added.has(keyOf(playlist.source, playlist.id))) library = [playlist, ...library];
			hidden = showPlaylist(playlist.source, playlist.id);
			if (playlist.status === 'loading') {
				loadPlaylist(playlist.source, playlist.id, { known: playlist });
			}
			addDialog?.close();
			return true;
		} catch {
			message = "That didn't go through. Please try again.";
			return false;
		} finally {
			pending = false;
		}
	}

	onMount(() => {
		device = readPlaylists();
		hidden = readHidden();
		refresh();
		// Back from logging in, or from a login that went wrong: this is where they were.
		if (page.url.searchParams.has('spotify')) addDialog?.showModal();
		const timer = setInterval(() => {
			if (library?.some((item) => item.status === 'loading')) refresh();
		}, POLL);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Your playlist | Filmoteka</title>
	<meta
		name="description"
		content="Load a whole Spotify or Deezer playlist once, then guess its songs together, from easy to legend."
	/>
</svelte:head>

<GameShell title="Your playlist">
	{#snippet status()}
		<button class="how-btn" type="button" onclick={() => howDialog?.showModal()}>How to play</button
		>
	{/snippet}

	<div class="page" style:--mode="var(--tier-{chosen.tier})">
		<div class="top rise">
			<h2>
				What are we
				<span class="playing">
					playing?
					<span class="eq" aria-hidden="true">
						{#each [1, 2, 3, 4, 5] as tier (tier)}
							<span style:--tier="var(--tier-{tier})" style:--i={tier}></span>
						{/each}
					</span>
				</span>
			</h2>
			{#if lastPlayed}
				<a class="keep" href={gameHref(lastPlayed)}>
					{#if lastPlayed.cover}<img src={lastPlayed.cover} alt="" />{/if}
					<span class="keep-text">
						<span class="keep-label">Keep going</span>
						<span class="keep-name">{lastPlayed.title}</span>
					</span>
					<Icon name="play" size={22} filled />
				</a>
			{/if}
		</div>

		<div class="modes rise" role="group" aria-label="Game">
			{#each MODES as item (item.id)}
				<button
					class="mode"
					class:on={mode === item.id}
					type="button"
					style:--color="var(--tier-{item.tier})"
					aria-pressed={mode === item.id}
					onclick={() => (mode = item.id)}
				>
					<span class="mode-name">{item.name}</span>
					<span class="mode-blurb">{item.blurb}</span>
				</button>
			{/each}
			<button
				class="mode"
				type="button"
				style:--color="var(--tier-5)"
				disabled={!playable.length}
				onclick={surprise}
			>
				<span class="mode-name">
					Surprise me
					<Icon name="shuffle" size={24} />
				</span>
				<span class="mode-blurb">Random playlist, go</span>
			</button>
		</div>

		<section class="library" aria-labelledby="pick-title">
			<div class="library-head">
				<h3 id="pick-title">Pick a playlist</h3>
				{#if spotify.available}
					<div class="account">
						{#if spotify.loggedIn}
							{#if mine?.image}<img src={mine.image} alt="" />{/if}
							<span class="account-name">
								{mineError
									? 'Spotify account not approved'
									: mine
										? `Spotify: ${mine.name || 'logged in'}`
										: 'Spotify…'}
							</span>
							<button class="link-btn" type="button" onclick={logout}>Log out</button>
						{:else}
							<span class="account-name">Not logged in to Spotify</span>
							<a class="link-btn" href="/api/spotify/login" data-sveltekit-reload>Log in</a>
						{/if}
					</div>
				{/if}
				<button class="btn" type="button" onclick={() => addDialog?.showModal()}>
					Add a playlist
				</button>
			</div>

			{#if failed}
				<p class="note">The playlists didn't load.</p>
				<button class="btn" type="button" onclick={refresh}>Try again</button>
			{:else if !library}
				<div class="skeleton placeholder" aria-busy="true"></div>
			{:else if !rows.length}
				<div class="empty">
					<p class="empty-title">No playlists yet</p>
					<p class="note">Add one once and everyone here can play it.</p>
					<button class="btn btn-primary" type="button" onclick={() => addDialog?.showModal()}>
						Add the first one
					</button>
				</div>
			{:else}
				<ul class="tiles">
					{#each rows as row, index (row.key)}
						<PlaylistTile
							{row}
							{index}
							href={tileHref(row)}
							onupdate={() => loadPlaylist(row.source, row.id, { update: true, known: row })}
							onresume={() => loadPlaylist(row.source, row.id, { known: row })}
							onhide={() => (hidden = hidePlaylist(row.source, row.id))}
						/>
					{/each}
				</ul>
			{/if}
		</section>
	</div>

	<dialog class="sheet" bind:this={addDialog} aria-labelledby="add-title">
		<div class="sheet-head">
			<h2 id="add-title">Add a playlist</h2>
			<button class="close" type="button" aria-label="Close" onclick={() => addDialog?.close()}>
				<Icon name="close" />
			</button>
		</div>
		<div class="sheet-body">
			<PlaylistAdd
				{spotify}
				{mine}
				{mineError}
				{added}
				{pending}
				{message}
				note={loginNote}
				onadd={add}
				onlogout={logout}
			/>
			<p class="note small">
				You only load it once, and you can start playing while it loads. It's then here for
				everyone, no login needed. The music comes from Deezer, so a few songs may be missing.
			</p>
		</div>
	</dialog>

	<dialog class="sheet" bind:this={howDialog} aria-labelledby="how-title">
		<div class="sheet-head">
			<h2 id="how-title">How to play</h2>
			<button class="close" type="button" aria-label="Close" onclick={() => howDialog?.close()}>
				<Icon name="close" />
			</button>
		</div>
		<dl class="how">
			<dt>The songs</dt>
			<dd>
				<span style:color="var(--tier-1)">Easy</span> is the playlist's biggest hits,
				<span style:color="var(--tier-5)">Legend</span> its deepest cuts.
			</dd>
			<dt>Guessing</dt>
			<dd>You start with 1 second. Every miss or skip plays more, up to 15 seconds.</dd>
			<dt>Yellow</dt>
			<dd>Right artist, wrong song.</dd>
			<dt>Next 5</dt>
			<dd>New songs each round. They only come back once the playlist has run out.</dd>
			<dt>Share</dt>
			<dd>Send the link from your result and your friends get the same songs.</dd>
			<dt>New songs</dt>
			<dd>Added some to the playlist? Open its menu and get just the new ones.</dd>
			<dt class="keys">Keyboard</dt>
			<dd class="keys">Space plays, just type to guess, Enter goes to the next song.</dd>
		</dl>
	</dialog>
</GameShell>

<style>
	.page {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: clamp(14px, 2.6vh, 24px);
		width: min(100%, 1180px);
		min-height: 0;
		margin-inline: auto;
		overflow-y: auto;
		padding: 4px 4px 8px;
	}

	.top {
		display: flex;
		flex: none;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 24px;
	}

	h2 {
		font-size: clamp(2rem, 5.4vw, 4rem);
		font-weight: 700;
		letter-spacing: -0.05em;
		line-height: 1;
	}

	.playing {
		white-space: nowrap;
	}

	.eq {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.07em;
		height: 0.72em;
		margin-left: 0.12em;
	}

	.eq span {
		width: 0.13em;
		height: 100%;
		background: var(--tier);
		border-radius: 999px;
		transform-origin: bottom;
		animation: dance 760ms var(--ease) infinite alternate;
		animation-delay: calc(var(--i) * -170ms);
	}

	@keyframes dance {
		from {
			transform: scaleY(0.28);
		}
	}

	.keep {
		display: flex;
		align-items: center;
		gap: 12px;
		max-width: min(100%, 340px);
		padding: 6px 16px 6px 6px;
		background: var(--text);
		border-radius: var(--radius-md);
		color: var(--bg);
		transition: transform 320ms var(--spring);
	}

	.keep:hover {
		transform: scale(1.04) rotate(-1deg);
	}

	.keep:active {
		transform: scale(0.96);
	}

	.keep img {
		flex: none;
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}

	.keep-text {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.keep-label {
		font-size: 0.875rem;
		font-weight: 500;
		opacity: 0.7;
	}

	.keep-name {
		overflow: hidden;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.modes {
		display: grid;
		flex: none;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.mode {
		display: grid;
		gap: 2px;
		padding: clamp(12px, 2.2vh, 20px) clamp(14px, 2vw, 22px);
		background: var(--surface);
		border-radius: var(--radius-lg);
		text-align: left;
		transition:
			background-color 180ms var(--ease),
			color 180ms var(--ease),
			transform 340ms var(--spring);
	}

	.mode:hover:not(:disabled) {
		transform: translateY(-3px) rotate(-0.6deg);
	}

	.mode:active:not(:disabled) {
		transform: scale(0.97);
	}

	.mode:disabled {
		opacity: 0.45;
	}

	.mode-name {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		color: var(--color);
		font-size: clamp(1.25rem, 2.8vw, 2rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	.mode-blurb {
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.mode.on {
		background: var(--color);
	}

	.mode.on .mode-name,
	.mode.on .mode-blurb {
		color: var(--on-accent);
	}

	.library {
		display: grid;
		flex: none;
		gap: 12px;
	}

	.library-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.library-head h3 {
		margin-right: auto;
	}

	.account {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		color: var(--text-muted);
	}

	.account img {
		flex: none;
		width: 28px;
		height: 28px;
		object-fit: cover;
		border-radius: 50%;
	}

	.account-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.link-btn {
		flex: none;
		color: var(--text);
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	h3 {
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		letter-spacing: -0.03em;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(168px, 42vw), 1fr));
		align-items: start;
		gap: clamp(12px, 2vw, 20px);
	}

	.note {
		color: var(--text-muted);
	}

	.small {
		font-size: 0.875rem;
	}

	.placeholder {
		height: 200px;
		border-radius: var(--radius-md);
	}

	.empty {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding-block: clamp(20px, 6vh, 56px);
		text-align: center;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.how-btn {
		color: var(--text);
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.sheet {
		width: min(100% - 32px, 520px);
		max-height: min(100dvh - 32px, 760px);
		margin: auto;
		padding: clamp(16px, 3vw, 24px);
		background: var(--surface);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-lg);
		color: var(--text);
	}

	.sheet[open] {
		animation: pop 260ms var(--spring);
	}

	.sheet::backdrop {
		background: rgb(0 0 0 / 0.65);
	}

	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}

	.sheet h2 {
		font-size: 1.5rem;
		letter-spacing: -0.03em;
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: 44px;
		height: 44px;
		margin: -8px -8px -8px 0;
		color: var(--text-muted);
	}

	.close:hover {
		color: var(--text);
	}

	.sheet-body {
		display: grid;
		gap: 20px;
	}

	.how {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 10px 16px;
	}

	.how dt {
		font-weight: 600;
	}

	.how dd {
		color: var(--text-muted);
	}

	@media (hover: none) {
		.keys {
			display: none;
		}
	}

	@media (max-width: 560px) {
		.modes {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.modes .mode:last-child {
			grid-column: 1 / -1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.eq span {
			animation: none;
		}
	}
</style>
