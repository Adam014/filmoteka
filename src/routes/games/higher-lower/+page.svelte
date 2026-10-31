<script>
	import { buzz, celebrate, focusOnMount } from '#lib/actions/motion.js';
	import CountUp from '#lib/components/CountUp.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import Pips from '#lib/components/Pips.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { nextGame } from '#lib/games/catalog.js';
	import { BEST_KEY, ROUNDS, buildRounds, verdict } from '#lib/games/higherLower.js';
	import { yearOf } from '#lib/format.js';
	import { imageUrl } from '#lib/media.js';
	import { getBest, submitScore } from '#lib/state/arcade.js';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	const REVEAL_MS = 1700;
	const next = nextGame('higher-lower');

	let pool = [];
	const used = new Set();

	let rounds = $state([]);
	let failed = $state(false);
	let index = $state(0);
	let phase = $state('guess');
	let picked = $state(null);
	let marks = $state([]);
	let best = $state(0);
	let isNewBest = $state(false);
	let timer;

	let pair = $derived(rounds[index]);
	let sides = $derived(pair ? [pair.a, pair.b] : []);
	let winner = $derived(pair ? (pair.a.rating > pair.b.rating ? 0 : 1) : 0);
	let score = $derived(marks.filter((mark) => mark === 'right').length);
	let lastRight = $derived(marks.at(-1) === 'right');
	let shareText = $derived.by(() => {
		if (phase !== 'over') return '';
		const squares = marks.map((mark) => (mark === 'right' ? '🟩' : '🟥')).join('');
		return `Filmoteka Higher or Lower ${score}/${ROUNDS}\n${squares}\n${location.origin}/games/higher-lower`;
	});

	function deal() {
		let dealt = buildRounds(pool, used);
		if (!dealt) {
			used.clear();
			dealt = buildRounds(pool, used);
		}
		rounds = dealt ?? [];
		index = 0;
		picked = null;
		marks = [];
		phase = 'guess';
		isNewBest = false;
		best = getBest(BEST_KEY);
		failed = !dealt;
	}

	async function load() {
		failed = false;
		try {
			const response = await fetch('/api/games/higher-lower');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			pool = (await response.json()).movies;
			deal();
		} catch {
			failed = true;
		}
	}

	onMount(() => {
		load();
		return () => clearTimeout(timer);
	});

	// The next pair is already loaded by the time it slides in.
	$effect(() => {
		const upcoming = rounds[index + 1];
		if (!upcoming) return;
		for (const movie of [upcoming.a, upcoming.b]) {
			new Image().src = imageUrl(movie.backdrop_path, 'w1280');
		}
	});

	function advance() {
		clearTimeout(timer);
		if (index + 1 < ROUNDS) {
			index += 1;
			picked = null;
			phase = 'guess';
			return;
		}
		isNewBest = submitScore(BEST_KEY, score);
		best = getBest(BEST_KEY);
		phase = 'over';
		if (score === ROUNDS) celebrate();
	}

	function choose(side) {
		if (phase === 'reveal') {
			advance();
			return;
		}
		if (phase !== 'guess') return;
		picked = side;
		phase = 'reveal';
		marks = [...marks, side === winner ? 'right' : 'wrong'];
		buzz(side === winner ? 10 : 40);
		timer = setTimeout(advance, REVEAL_MS);
	}

	function onkeydown(event) {
		if (document.querySelector('dialog[open]') || !pair) return;
		if (event.key === 'ArrowLeft' || event.key === '1') choose(0);
		if (event.key === 'ArrowRight' || event.key === '2') choose(1);
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>Higher or Lower | Filmoteka</title>
	<meta name="description" content="Two films, five rounds. Pick the one rated higher." />
</svelte:head>

<GameShell title="Higher or Lower" bleed>
	{#snippet status()}
		<Pips total={ROUNDS} {marks} label="Round {Math.min(index + 1, ROUNDS)} of {ROUNDS}" />
	{/snippet}

	{#if failed}
		<div class="container">
			<EmptyState title="The films didn't load">
				<p>Give it another go in a moment.</p>
				<button class="btn" type="button" onclick={load}>Try again</button>
			</EmptyState>
		</div>
	{:else}
		<div class="arena">
			{#if !pair}
				<div class="skeleton side"></div>
				<div class="skeleton side"></div>
			{:else}
				{#each sides as movie, side (movie.id)}
					<button
						class="side"
						class:win={phase !== 'guess' && side === winner}
						class:lose={phase !== 'guess' && side !== winner}
						class:shake={phase === 'reveal' && picked === side && side !== winner}
						type="button"
						aria-label="{movie.title}{phase === 'guess' ? '' : `, rated ${movie.rating}`}"
						onclick={() => choose(side)}
						in:fly={{ x: side ? 70 : -70, duration: 480 }}
					>
						<img src={imageUrl(movie.backdrop_path, 'w1280')} alt="" draggable="false" />
						<span class="copy">
							<span class="title">{movie.title}</span>
							{#if yearOf(movie.date)}<span class="year">{yearOf(movie.date)}</span>{/if}
						</span>
						<span class="rating">
							<Icon name="star" size={28} filled />
							{#if phase === 'guess'}
								<span class="unknown">?</span>
							{:else}
								<CountUp value={movie.rating} decimals={1} duration={1000} />
							{/if}
						</span>
					</button>
				{/each}

				<p
					class="prompt"
					class:right={phase === 'reveal' && lastRight}
					class:wrong={phase === 'reveal' && !lastRight}
					aria-live="polite"
				>
					{#if phase === 'reveal'}
						{lastRight ? 'Correct' : 'Not this one'}
					{:else}
						Which is rated higher?
					{/if}
				</p>
			{/if}

			{#if phase === 'over'}
				<div class="over" role="status">
					<div class="card">
						<p class="final"><CountUp value={score} duration={600} /><span>/{ROUNDS}</span></p>
						<p class="line">{isNewBest ? 'New best!' : verdict(score)}</p>
						<div class="result-pips"><Pips total={ROUNDS} {marks} label="Your rounds" /></div>
						<div class="actions">
							<button class="btn btn-primary" type="button" onclick={deal} use:focusOnMount>
								Play again
							</button>
							<ShareButton text={shareText} />
						</div>
						<a class="link next" href={next.href}>Next: {next.name}</a>
						{#if best && !isNewBest}<p class="best">Best {best}/{ROUNDS}</p>{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</GameShell>

<style>
	.arena {
		position: relative;
		display: grid;
		flex: 1;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2px;
		min-height: 0;
		overflow: hidden;
	}

	.side {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		min-width: 0;
		min-height: 0;
		padding: clamp(16px, 3vw, 40px);
		overflow: hidden;
		isolation: isolate;
		background: var(--surface);
		border-radius: 0;
		text-align: left;
	}

	.side img {
		position: absolute;
		z-index: -2;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition:
			transform 700ms var(--ease),
			filter 400ms var(--ease);
		user-select: none;
	}

	.side::after {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 0;
		background: linear-gradient(to top, rgb(10 10 11 / 0.92), rgb(10 10 11 / 0.08) 62%);
		transition: background-color 300ms var(--ease);
	}

	.side:hover img,
	.side:focus-visible img {
		transform: scale(1.05);
	}

	.side.win::after {
		background-color: rgb(76 195 138 / 0.22);
	}

	.side.lose img {
		filter: grayscale(1) brightness(0.55);
	}

	.side.shake {
		animation: shake 380ms var(--ease);
	}

	.copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.title {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: clamp(1.25rem, 3vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.year {
		color: var(--text-muted);
	}

	.rating {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.rating :global(svg) {
		color: var(--accent);
	}

	.unknown {
		color: var(--text-faint);
	}

	.win .rating {
		animation: bump 520ms var(--spring);
	}

	@keyframes bump {
		from {
			transform: scale(0.7);
		}
	}

	.prompt {
		position: absolute;
		top: 14px;
		left: 50%;
		padding: 8px 16px;
		background: rgb(10 10 11 / 0.82);
		border-radius: 999px;
		font-weight: 500;
		white-space: nowrap;
		pointer-events: none;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transform: translateX(-50%);
	}

	.prompt.right {
		color: var(--success);
	}

	.prompt.wrong {
		color: var(--danger);
	}

	.over {
		position: absolute;
		z-index: 2;
		inset: 0;
		display: grid;
		place-items: center;
		padding: var(--gutter);
		background: rgb(10 10 11 / 0.72);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		animation: fade 240ms var(--ease);
	}

	.card {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
		animation: pop 420ms var(--spring);
	}

	.final {
		font-size: clamp(4rem, 12vw, 7rem);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1;
	}

	.final span:last-child {
		color: var(--text-faint);
		font-size: 0.5em;
	}

	.line {
		font-size: 1.25rem;
		font-weight: 500;
	}

	.result-pips {
		margin-block: 4px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 8px;
	}

	.next {
		margin-top: 6px;
		color: var(--text-muted);
	}

	.best {
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	/* Portrait screens stack the two films, and each half is one big thumb target. */
	@media (max-width: 767px), (orientation: portrait) {
		.arena {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: repeat(2, minmax(0, 1fr));
		}

		.prompt {
			top: 50%;
			transform: translate(-50%, -50%);
		}
	}
</style>
