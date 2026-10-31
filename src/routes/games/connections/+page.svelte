<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import Countdown from '#lib/components/Countdown.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
	import { nextGame } from '#lib/games/catalog.js';
	import { hashString, seededShuffle } from '#lib/games/seed.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';

	const GAME = 'connections';
	const MAX_MISTAKES = 4;
	const MAX_HINTS = 2;
	const HOP_MS = 520;
	const SQUARES = ['🟨', '🟩', '🟦', '🟪'];
	const next = nextGame(GAME);

	let puzzle = $state(null);
	let failed = $state(false);
	let order = $state([]);
	let selected = $state([]);
	let solved = $state([]);
	let tried = $state([]);
	let hints = $state([]);
	let mistakes = $state(0);
	let phase = $state('playing');
	let shaking = $state(false);
	let hopping = $state(false);
	let pending = $state(false);
	let streak = $state(0);
	let message = $state('');
	let tapped = $state('');
	let shuffles = 0;

	let finished = $derived(phase !== 'playing');
	let solvedIds = $derived(new Set(solved.flatMap((group) => group.films.map((film) => film.id))));
	let tiles = $derived(
		order
			.map((id) => puzzle?.tiles.find((tile) => tile.id === id))
			.filter((tile) => tile && !solvedIds.has(tile.id))
	);
	let remaining = $derived(4 - selected.length);
	let shareText = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const levels = new Map(
			solved.flatMap((group) => group.films.map((film) => [film.id, group.level]))
		);
		const rows = tried.map((ids) => ids.map((id) => SQUARES[levels.get(id)]).join(''));
		const clues = hints.length
			? ` with ${hints.length} ${hints.length === 1 ? 'clue' : 'clues'}`
			: '';
		return `Filmoteka Connections #${puzzle.number}${clues}\n${rows.join('\n')}\n${location.origin}/games/connections`;
	});

	const persist = () =>
		savePlay(GAME, puzzle.key, $state.snapshot({ solved, tried, mistakes, status: phase, hints }));

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const response = await fetch('/api/games/connections');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const today = await response.json();
			order = today.tiles.map((tile) => tile.id);
			const saved = getPlay(GAME, today.key);
			if (saved) {
				solved = saved.solved;
				tried = saved.tried;
				mistakes = saved.mistakes;
				phase = saved.status;
				hints = saved.hints ?? [];
			}
			puzzle = today;
			streak = getStreak(GAME, today.key);
		} catch {
			failed = true;
		}
	}

	onMount(start);

	function toggle(tile) {
		if (finished || pending) return;
		message = '';
		tapped = tile.title;
		buzz(6);
		if (selected.includes(tile.id)) selected = selected.filter((id) => id !== tile.id);
		else if (selected.length < 4) selected = [...selected, tile.id];
	}

	function shuffle() {
		order = seededShuffle(order, hashString(`${puzzle.key}:${++shuffles}:${Date.now()}`));
	}

	async function post(body) {
		const response = await fetch('/api/games/connections', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ key: puzzle.key, ...body })
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}

	async function askHint() {
		if (pending || hints.length >= MAX_HINTS) return;
		pending = true;
		try {
			const found = solved.map((group) => group.level);
			const { label, level } = await post({
				hint: true,
				found: [...found, ...hints.map((item) => item.level)]
			});
			if (label) {
				message = '';
				hints = [...hints, { label, level }];
				persist();
			} else {
				message = 'No more clues.';
			}
		} catch {
			toast.error("That clue didn't load. Please try again.");
		} finally {
			pending = false;
		}
	}

	async function submit() {
		if (selected.length !== 4 || pending) return;
		const attempt = [...selected].sort((a, b) => a - b).join();
		if (tried.some((ids) => [...ids].sort((a, b) => a - b).join() === attempt)) {
			message = 'You already tried those four.';
			return;
		}

		pending = true;
		try {
			const outcome = await post({ ids: selected });
			tried = [...tried, [...selected]];

			if (outcome.correct) {
				hopping = true;
				buzz(15);
				await new Promise((resolve) => setTimeout(resolve, HOP_MS));
				hopping = false;
				solved = [...solved, outcome.group];
				hints = hints.filter((item) => item.label !== outcome.group.label);
				selected = [];
				message = '';
				tapped = '';
				if (solved.length === 4) {
					phase = 'won';
					celebrate();
				}
			} else {
				shaking = true;
				buzz(40);
				mistakes += 1;
				message = outcome.oneAway ? 'One away!' : 'Not a group.';
				if (mistakes >= MAX_MISTAKES) {
					const { groups } = await post({ reveal: true });
					const found = new Set(solved.map((group) => group.level));
					solved = [...solved, ...groups.filter((group) => !found.has(group.level))];
					selected = [];
					message = '';
					phase = 'lost';
				}
			}
			persist();
			streak = getStreak(GAME, puzzle.key);
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head>
	<title>Connections | Filmoteka</title>
	<meta name="description" content="Sort 16 films into 4 hidden groups." />
</svelte:head>

<GameShell title="Connections">
	{#snippet status()}
		{#if puzzle && !finished}
			<span class="tries" aria-label="{MAX_MISTAKES - mistakes} mistakes left">
				<span class="tries-label" aria-hidden="true">Mistakes left</span>
				<span class="dots" aria-hidden="true">
					{#each { length: MAX_MISTAKES }, index (index)}
						<span class="dot" class:gone={index >= MAX_MISTAKES - mistakes}></span>
					{/each}
				</span>
			</span>
		{:else if streak > 1}
			<span>{streak}-day streak</span>
		{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's puzzle didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else}
		<p class="line" class:alert={message} aria-live="polite">
			{#if message}
				{message}
			{:else if finished}
				{phase === 'won' ? 'All four found.' : 'Out of mistakes. Here are the groups.'}
			{:else if hints.length}
				Clue: {hints.map((item) => item.label).join(' · ')}
			{:else if tapped && selected.length}
				<span class="tapped">{tapped}</span>
				<span class="howto">Find 4 groups of 4. Each shares a director or a star.</span>
			{:else}
				Find 4 groups of 4. Each shares a director or a star.
			{/if}
		</p>

		<div class="board" aria-busy={!puzzle}>
			{#if !puzzle}
				{#each { length: 16 }, index (index)}
					<div class="skeleton tile"></div>
				{/each}
			{:else}
				{#each solved as group (group.level)}
					<div class="band level-{group.level}">
						<strong>{group.label}</strong>
						<span>{group.films.map((film) => film.title).join(' · ')}</span>
					</div>
				{/each}
				{#each tiles as tile (tile.id)}
					{@const picked = selected.includes(tile.id)}
					<button
						class="tile"
						class:picked
						class:shaking={shaking && picked}
						class:hop={hopping && picked}
						style:--i={selected.indexOf(tile.id)}
						type="button"
						aria-pressed={picked}
						aria-label={tile.title}
						onclick={() => toggle(tile)}
						onanimationend={() => (shaking = false)}
						animate:flip={{ duration: 420 }}
					>
						<picture>
							<source
								media="(min-width: 768px) and (orientation: landscape)"
								srcset={imageUrl(tile.backdrop_path, 'w500')}
							/>
							<img src={imageUrl(tile.poster_path, 'w185')} alt="" draggable="false" />
						</picture>
						<span class="caption">{tile.title}</span>
					</button>
				{/each}
			{/if}
		</div>

		{#if puzzle}
			<div class="dock">
				{#if finished}
					<div class="actions">
						<ShareButton text={shareText} primary />
						<a class="btn btn-quiet" href={next.href}>Next: {next.name}</a>
					</div>
					<Countdown />
				{:else}
					<div class="controls">
						<button class="btn btn-quiet" type="button" aria-label="Shuffle" onclick={shuffle}>
							<Icon name="shuffle" size={18} /><span class="wide">Shuffle</span>
						</button>
						<button
							class="btn btn-quiet"
							type="button"
							disabled={hints.length >= MAX_HINTS || pending}
							onclick={askHint}
						>
							Clue
						</button>
						<button
							class="btn btn-quiet"
							type="button"
							disabled={!selected.length}
							onclick={() => {
								selected = [];
								tapped = '';
								message = '';
							}}
						>
							Clear
						</button>
						<button
							class="btn btn-primary check"
							type="button"
							disabled={remaining > 0 || pending}
							onclick={submit}
						>
							{remaining > 0 ? `Pick ${remaining} more` : 'Check'}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</GameShell>

<style>
	.tries {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dots {
		display: inline-flex;
		gap: 5px;
	}

	.dot {
		width: 10px;
		height: 10px;
		background: var(--text);
		border-radius: 50%;
		transition:
			transform 320ms var(--spring),
			opacity 200ms var(--ease);
	}

	.dot.gone {
		opacity: 0.2;
		transform: scale(0.7);
	}

	.line {
		flex: none;
		min-height: 1.5em;
		margin-bottom: 10px;
		overflow: hidden;
		color: var(--text-muted);
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.line.alert {
		color: var(--text);
		font-weight: 600;
		animation: pop 320ms var(--spring);
	}

	.tapped {
		display: none;
		color: var(--text);
	}

	.board {
		display: grid;
		flex: 1;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-template-rows: repeat(4, minmax(0, 1fr));
		gap: clamp(6px, 1vw, 10px);
		width: min(100%, 1120px);
		min-height: 0;
		margin-inline: auto;
	}

	.tile {
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-sm);
		outline: 3px solid transparent;
		outline-offset: -3px;
		transition:
			transform 280ms var(--spring),
			outline-color 120ms var(--ease);
	}

	.tile:hover {
		transform: translateY(-2px);
	}

	.tile.picked {
		outline-color: var(--text);
		transform: scale(0.95);
	}

	.tile.shaking {
		animation: shake 380ms var(--ease);
	}

	.tile.hop {
		animation: hop 420ms var(--ease) both;
		animation-delay: calc(var(--i) * 60ms);
	}

	@keyframes hop {
		50% {
			transform: translateY(-14px) scale(0.95);
		}
	}

	picture {
		display: block;
		width: 100%;
		height: 100%;
	}

	.tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
	}

	.caption {
		position: absolute;
		inset: auto 0 0;
		overflow: hidden;
		padding: 28px 10px 8px;
		background: linear-gradient(to top, rgb(10 10 11 / 0.95) 35%, transparent);
		font-size: 0.9375rem;
		font-weight: 500;
		line-height: 1.2;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.band {
		display: grid;
		grid-column: 1 / -1;
		align-content: center;
		justify-items: center;
		gap: 2px;
		min-height: 0;
		padding: 6px 14px;
		overflow: hidden;
		color: #0a0a0b;
		border-radius: var(--radius-sm);
		text-align: center;
		animation: pop 460ms var(--spring);
	}

	.band strong {
		font-size: clamp(1rem, 2vw, 1.25rem);
	}

	.band span {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: 0.9375rem;
		line-height: 1.2;
	}

	.level-0 {
		background: #ffc53d;
	}

	.level-1 {
		background: var(--success);
	}

	.level-2 {
		background: #7cc0ff;
	}

	.level-3 {
		background: #cdb1ff;
	}

	.dock {
		flex: none;
		width: min(100%, 1120px);
		margin: 12px auto 0;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.check {
		min-width: 140px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.dock :global(.countdown) {
		text-align: center;
	}

	/* Four across leaves no room for titles on a phone: posters carry them, and a tap names them. */
	@media (max-width: 767px), (orientation: portrait) {
		.caption,
		.tries-label,
		.wide,
		.howto {
			display: none;
		}

		.tapped {
			display: inline;
		}

		.controls .btn-quiet {
			padding-inline: 12px;
		}

		.check {
			flex: 1;
			min-width: 0;
		}

		.line {
			font-size: 0.9375rem;
		}
	}
</style>
