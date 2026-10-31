<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameResult from '#lib/components/GameResult.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { plural, yearOf } from '#lib/format.js';
	import { summarise } from '#lib/games/filmle.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';

	const GAME = 'filmle';

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let guesses = $state([]);
	let hints = $state([]);
	let phase = $state('playing');
	let answer = $state(null);
	let streak = $state(0);

	let finished = $derived(phase !== 'playing');
	let left = $derived(puzzle ? puzzle.total - guesses.length : 0);
	let known = $derived(summarise(guesses));
	let last = $derived(guesses.at(-1));
	let share = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const fields = ['year', 'rating', 'runtime'];
		const rows = guesses
			.map(({ compare }) =>
				[
					...fields.map((field) => compare[field].match),
					compare.genres.hits.length ? 'close' : 'none',
					compare.directors.hits.length ? 'exact' : 'none',
					compare.cast.hits.length ? 'exact' : 'none'
				]
					.map((match) => ({ exact: '🟩', close: '🟨', none: '⬛' })[match])
					.join('')
			)
			.join('\n');
		const score = phase === 'won' ? `${guesses.length}/${puzzle.total}` : `X/${puzzle.total}`;
		return `Filmoteka Filmle #${puzzle.number} ${score}\n${rows}\n${location.origin}/games/filmle`;
	});

	const format = {
		year: (value) => String(value),
		rating: (value) => value.toFixed(1),
		runtime: (value) => `${value} min`
	};

	/** The tightest range the guesses allow, or the answer once a guess has hit it. */
	function rangeText({ low, high, exact }, field) {
		if (exact !== null) return format[field](exact);
		const hasLow = Number.isFinite(low);
		const hasHigh = Number.isFinite(high);
		if (hasLow && hasHigh) return `${format[field](low)} – ${format[field](high)}`;
		if (hasLow) return `${field === 'year' ? 'after' : 'over'} ${format[field](low)}`;
		if (hasHigh) return `${field === 'year' ? 'before' : 'under'} ${format[field](high)}`;
		return '?';
	}

	const rangeState = ({ exact, close }) => (exact !== null ? 'exact' : close ? 'close' : '');

	let board = $derived([
		{ label: 'Year', text: rangeText(known.year, 'year'), state: rangeState(known.year) },
		{ label: 'Rating', text: rangeText(known.rating, 'rating'), state: rangeState(known.rating) },
		{
			label: 'Length',
			text: rangeText(known.runtime, 'runtime'),
			state: rangeState(known.runtime)
		},
		{
			label: 'Genres',
			text: known.genres.hits.join(', ') || '?',
			state: known.genres.hits.length ? 'close' : '',
			note: known.genres.misses.length ? `Not ${known.genres.misses.join(', ')}` : ''
		},
		{
			label: 'Director',
			text: known.directors.hits.join(', ') || '?',
			state: known.directors.hits.length ? 'exact' : '',
			note: known.directors.misses.length
				? `Not ${known.directors.misses.slice(-2).join(', ')}`
				: ''
		},
		{
			label: 'Cast',
			text: known.cast.hits.slice(0, 3).join(', ') || '?',
			state: known.cast.hits.length ? 'exact' : ''
		}
	]);

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const response = await fetch('/api/games/filmle');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const today = await response.json();
			const saved = getPlay(GAME, today.key);
			if (saved) {
				guesses = saved.guesses;
				hints = saved.hints ?? [];
				phase = saved.status;
				answer = saved.answer;
			}
			puzzle = today;
			streak = getStreak(GAME, today.key);
		} catch {
			failed = true;
		}
	}

	onMount(start);

	async function submit(result) {
		if (pending || finished) return;
		if (guesses.some((item) => item.id === result.id)) {
			toast.info(`You already tried “${result.title}”.`);
			return;
		}
		pending = true;
		try {
			const response = await fetch('/api/games/filmle', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, attempt: guesses.length, id: result.id })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();
			guesses = [
				...guesses,
				{ ...outcome.guess, compare: outcome.compare, correct: outcome.correct }
			];
			if (outcome.hint) hints = [...hints, outcome.hint];
			if (outcome.finished) {
				phase = outcome.correct ? 'won' : 'lost';
				answer = outcome.answer;
			}
			if (outcome.correct) celebrate();
			else buzz(30);
			savePlay(GAME, puzzle.key, $state.snapshot({ guesses, hints, status: phase, answer }));
			streak = getStreak(GAME, puzzle.key);
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head>
	<title>Filmle | Filmoteka</title>
	<meta
		name="description"
		content="Guess any film and see what it shares with today's mystery film. Ten tries."
	/>
</svelte:head>

<GameShell title="Filmle">
	{#snippet status()}
		{#if streak > 1}<span>{streak}-day streak</span>{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's film didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else if !puzzle}
		<div class="stage"><div class="skeleton loading" aria-busy="true"></div></div>
	{:else}
		<div class="stage">
			<ol class="strip" aria-label="Your guesses">
				{#each { length: puzzle.total }, index (index)}
					{@const guess = guesses[index]}
					<li class:hit={guess?.correct}>
						{#if guess?.poster_path}
							<img
								class="pop-in"
								src={imageUrl(guess.poster_path, 'w154')}
								alt={guess.title}
								title={guess.title}
							/>
						{:else if guess}
							<span class="visually-hidden">{guess.title}</span>
						{/if}
					</li>
				{/each}
			</ol>

			<ul class="board" aria-label="What you know so far">
				{#each board as cell (cell.label)}
					<li class={cell.state}>
						<span class="cell-label">{cell.label}</span>
						{#key cell.text}<span class="cell-text">{cell.text}</span>{/key}
						{#if cell.note}<span class="cell-note">{cell.note}</span>{/if}
					</li>
				{/each}
			</ul>

			{#if !finished && hints.length}
				<ul class="hints" aria-label="Hints">
					{#each hints as hint (hint)}<li class="rise">{hint}</li>{/each}
				</ul>
			{/if}
		</div>

		<div class="dock">
			{#if finished}
				<GameResult
					game={GAME}
					won={phase === 'won'}
					verdict={phase === 'won'
						? `Got it in ${plural(guesses.length, 'guess', 'guesses')}`
						: 'The film was'}
					heading={[answer?.title, yearOf(answer?.date)].filter(Boolean).join(', ')}
					{share}
					href="/movie/{answer?.id}"
					hrefLabel="View film"
				/>
			{:else}
				<p class="line" aria-live="polite">
					{#if last}<span class="last">Not “{last.title}”.</span>{/if}
					<span>{plural(left, 'guess', 'guesses')} left</span>
				</p>
				<MovieGuess onpick={submit} placeholder="Guess any film" up />
			{/if}
		</div>
	{/if}
</GameShell>

<style>
	.stage {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 10px;
		width: min(100%, 860px);
		min-height: 0;
		margin-inline: auto;
	}

	.loading {
		width: 100%;
		height: 100%;
	}

	.strip {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: 4px;
		flex: none;
	}

	.strip li {
		aspect-ratio: 2 / 3;
		max-height: 13vh;
		overflow: hidden;
		background: rgb(255 255 255 / 0.04);
		border-radius: 6px;
	}

	.strip li.hit {
		outline: 2px solid var(--success);
		outline-offset: -2px;
	}

	.strip img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.pop-in {
		animation: pop 420ms var(--spring) both;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		flex: 1;
		gap: 6px;
		max-height: 340px;
		min-height: 0;
	}

	.board li {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		min-width: 0;
		min-height: 0;
		padding: clamp(6px, 1.4vh, 16px) clamp(8px, 1.4vw, 16px);
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
		transition:
			background-color 320ms var(--ease),
			color 320ms var(--ease);
	}

	.board .exact {
		background: var(--success);
		color: var(--bg);
	}

	.board .close {
		background: var(--close);
		color: var(--bg);
	}

	.cell-label {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.exact .cell-label,
	.close .cell-label,
	.exact .cell-note,
	.close .cell-note {
		color: inherit;
		opacity: 0.75;
	}

	.cell-text {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: clamp(0.9375rem, 2.2vw, 1.375rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
		animation: pop 340ms var(--spring) both;
	}

	.cell-note {
		overflow: hidden;
		color: var(--text-faint);
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hints {
		display: grid;
		flex: none;
		gap: 2px;
		color: var(--accent);
	}

	.dock {
		flex: none;
		width: min(100%, 680px);
		margin: 12px auto 0;
	}

	.line {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 12px;
		margin-bottom: 8px;
		color: var(--text-muted);
	}

	.last {
		color: var(--danger);
	}

	@media (max-width: 560px) {
		.board {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.cell-note {
			display: none;
		}
	}
</style>
