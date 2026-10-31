<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameResult from '#lib/components/GameResult.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { plural } from '#lib/format.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';

	const GAME = 'grid';
	const cellKey = (row, column) => `${row}-${column}`;

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let cells = $state({});
	let left = $state(9);
	let phase = $state('playing');
	let examples = $state(null);
	let active = $state(null);
	let streak = $state(0);
	let message = $state('');
	let shaking = $state(null);
	let confirming = $state(false);

	let finished = $derived(phase !== 'playing');
	let solved = $derived(Object.keys(cells).length);
	let share = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const rows = [0, 1, 2]
			.map((row) => [0, 1, 2].map((column) => (cells[cellKey(row, column)] ? '🟩' : '⬛')).join(''))
			.join('\n');
		return `Filmoteka Movie Grid #${puzzle.number} ${solved}/9\n${rows}\n${location.origin}/games/grid`;
	});
	let asking = $derived(
		active && puzzle
			? `${puzzle.rows[active.row].name} × ${puzzle.columns[active.column].label}`
			: ''
	);

	function persist() {
		savePlay(
			GAME,
			puzzle.key,
			$state.snapshot({ cells, left, status: phase, examples, score: solved })
		);
		streak = getStreak(GAME, puzzle.key);
	}

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const response = await fetch('/api/games/grid');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const today = await response.json();
			const saved = getPlay(GAME, today.key);
			left = today.total;
			if (saved) {
				cells = saved.cells;
				left = saved.left;
				phase = saved.status;
				examples = saved.examples;
			}
			puzzle = today;
			streak = getStreak(GAME, today.key);
		} catch {
			failed = true;
		}
	}

	onMount(start);

	async function finish(result) {
		phase = result;
		active = null;
		if (result === 'won') celebrate();
		try {
			const response = await fetch('/api/games/grid', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, reveal: true })
			});
			if (response.ok) examples = (await response.json()).examples;
		} catch {
			// The result still stands, just without example answers.
		}
		persist();
	}

	async function submit(result) {
		if (pending || finished || !active) return;
		if (Object.values(cells).some((film) => film.id === result.id)) {
			toast.info(`“${result.title}” is already on the grid.`);
			return;
		}
		pending = true;
		const { row, column } = active;
		try {
			const response = await fetch('/api/games/grid', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, row, column, id: result.id })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();
			left -= 1;
			if (outcome.correct) {
				cells = { ...cells, [cellKey(row, column)]: outcome.film };
				active = null;
				message = '';
				buzz(10);
			} else {
				message = `“${result.title}” doesn't fit.`;
				shaking = cellKey(row, column);
				buzz(40);
			}
			if (Object.keys(cells).length === 9) await finish('won');
			else if (left === 0) await finish('lost');
			else persist();
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}

	function select(row, column) {
		if (finished || cells[cellKey(row, column)]) return;
		active = { row, column };
		message = '';
	}
</script>

<svelte:head>
	<title>Movie Grid | Filmoteka</title>
	<meta name="description" content="Fill nine squares with films that fit both clues." />
</svelte:head>

<GameShell title="Movie Grid">
	{#snippet status()}
		{#if streak > 1}<span>{streak}-day streak</span>{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's grid didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else if !puzzle}
		<div class="stage"><div class="skeleton loading" aria-busy="true"></div></div>
	{:else}
		<div class="stage">
			<div class="grid" role="group" aria-label="Movie grid">
				<span class="corner" aria-hidden="true"></span>
				{#each puzzle.columns as column (column.id)}
					<span class="head">{column.label}</span>
				{/each}
				{#each puzzle.rows as actor, row (actor.id)}
					<div class="actor">
						{#if actor.profile_path}
							<img src={imageUrl(actor.profile_path, 'w185')} alt="" />
						{/if}
						<span>{actor.name}</span>
					</div>
					{#each puzzle.columns as column, index (column.id)}
						{@const key = cellKey(row, index)}
						{@const film = cells[key]}
						{@const example = finished && !film ? examples?.[row]?.[index] : null}
						<button
							type="button"
							class="cell"
							class:filled={film}
							class:example
							class:selected={active?.row === row && active?.column === index}
							class:shaking={shaking === key}
							disabled={finished || Boolean(film)}
							aria-label="{actor.name} and {column.label}{film ? `: ${film.title}` : ''}"
							onanimationend={() => (shaking = null)}
							onclick={() => select(row, index)}
						>
							{#if film?.poster_path || example?.poster_path}
								<img src={imageUrl((film ?? example).poster_path, 'w185')} alt="" />
								<span class="cell-title">{(film ?? example).title}</span>
							{:else if film || example}
								<span class="cell-title plain">{(film ?? example).title}</span>
							{/if}
						</button>
					{/each}
				{/each}
			</div>
		</div>

		<div class="dock">
			{#if finished}
				<GameResult
					game={GAME}
					won={phase === 'won'}
					verdict={phase === 'won' ? 'An immaculate grid' : 'Dimmed squares are examples'}
					heading="{solved} of 9 squares"
					{share}
				/>
			{:else}
				<p class="line" aria-live="polite">
					{#if message}<span class="missed">{message}</span>{/if}
					<span>{plural(left, 'guess', 'guesses')} left</span>
				</p>
				{#if active}
					<div class="row">
						<div class="slot">
							<MovieGuess onpick={submit} placeholder={asking} up />
						</div>
						<button class="btn" type="button" onclick={() => (active = null)}>Back</button>
					</div>
				{:else}
					<div class="row prompt">
						<p>Pick a square, then name a film that fits both clues.</p>
						<button
							class="btn"
							type="button"
							onblur={() => (confirming = false)}
							onclick={() => (confirming ? finish('lost') : (confirming = true))}
						>
							{confirming ? 'Really give up?' : 'Give up'}
						</button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</GameShell>

<style>
	.stage {
		display: grid;
		flex: 1;
		place-items: center;
		min-height: 0;
		container-type: size;
	}

	.loading {
		width: 100%;
		height: 100%;
	}

	/* Always square-ish cells, sized by whichever side of the screen runs out first. */
	.grid {
		--unit: min(calc((100cqw - 3 * 6px) / 3.7), calc((100cqh - 3 * 6px - 40px) / 3));
		display: grid;
		grid-template-columns: calc(var(--unit) * 0.7) repeat(3, var(--unit));
		grid-template-rows: 40px repeat(3, var(--unit));
		gap: 6px;
	}

	.corner {
		display: block;
	}

	.head {
		display: grid;
		place-items: center;
		overflow: hidden;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-align: center;
	}

	.actor {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-width: 0;
		overflow: hidden;
		text-align: center;
	}

	.actor img {
		flex: 0 1 auto;
		width: min(100%, calc(var(--unit) * 0.48));
		min-height: 0;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 50%;
	}

	.actor span {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.15;
	}

	.cell {
		position: relative;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
		outline: 2px solid transparent;
		outline-offset: -2px;
		transition:
			background-color 160ms var(--ease),
			outline-color 160ms var(--ease),
			transform 300ms var(--spring);
	}

	.cell:hover:not(:disabled) {
		background: var(--surface-raised);
		transform: scale(1.02);
	}

	.cell.selected {
		outline-color: var(--accent);
	}

	.cell.shaking {
		animation: shake 380ms var(--ease);
		outline-color: var(--danger);
	}

	.cell img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		animation: pop 420ms var(--spring) both;
	}

	.cell.example img {
		filter: grayscale(1);
		opacity: 0.45;
	}

	.cell-title {
		position: absolute;
		inset: auto 0 0;
		padding: 16px 6px 4px;
		overflow: hidden;
		background: linear-gradient(to top, rgb(8 9 11 / 0.92), transparent);
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.15;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cell-title.plain {
		inset: 0;
		display: grid;
		place-items: center;
		background: none;
		white-space: normal;
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

	.missed {
		color: var(--danger);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.slot {
		flex: 1;
		min-width: 0;
	}

	.prompt p {
		flex: 1;
		color: var(--text-muted);
	}
</style>
