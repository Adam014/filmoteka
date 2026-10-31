<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameResult from '#lib/components/GameResult.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import { plural, yearOf } from '#lib/format.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';

	const GAME = 'emoji';

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let guesses = $state([]);
	let phase = $state('playing');
	let answer = $state(null);
	let streak = $state(0);
	let missed = $state('');
	let shaking = $state(false);

	let finished = $derived(phase !== 'playing');
	let left = $derived(puzzle ? puzzle.total - guesses.length : 0);
	let share = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const squares = guesses.map((item) => (item.correct ? '🟩' : '🟥')).join('');
		const score = phase === 'won' ? `${guesses.length}/${puzzle.total}` : `X/${puzzle.total}`;
		return `Filmoteka Emoji #${puzzle.number} ${score}\n${puzzle.emoji.join('')}\n${squares}\n${location.origin}/games/emoji`;
	});

	async function fetchClues(attempt, key = '') {
		const params = new URLSearchParams({ attempt: String(attempt) });
		if (key) params.set('key', key);
		const response = await fetch(`/api/games/emoji?${params}`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const today = await fetchClues(0);
			const saved = getPlay(GAME, today.key);
			if (saved) {
				guesses = saved.guesses;
				phase = saved.status;
				answer = saved.answer;
			}
			const attempt = saved?.status !== 'playing' && saved ? today.total - 1 : guesses.length;
			puzzle = attempt ? await fetchClues(attempt, today.key) : today;
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
			const attempt = guesses.length;
			const response = await fetch('/api/games/emoji', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, attempt, id: result.id })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();
			puzzle = await fetchClues(outcome.finished ? puzzle.total - 1 : attempt + 1, puzzle.key);
			guesses = [...guesses, { id: result.id, title: result.title, correct: outcome.correct }];
			if (outcome.finished) {
				phase = outcome.correct ? 'won' : 'lost';
				answer = outcome.answer;
			}
			missed = outcome.correct ? '' : result.title;
			if (outcome.correct) celebrate();
			else {
				shaking = true;
				buzz(40);
			}
			savePlay(GAME, puzzle.key, $state.snapshot({ guesses, status: phase, answer }));
			streak = getStreak(GAME, puzzle.key);
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head>
	<title>Emoji | Filmoteka</title>
	<meta name="description" content="Name the film from a line of emoji. A new one every day." />
</svelte:head>

<GameShell title="Emoji">
	{#snippet status()}
		{#if streak > 1}<span>{streak}-day streak</span>{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's emoji didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else if !puzzle}
		<div class="stage"><div class="skeleton loading" aria-busy="true"></div></div>
	{:else}
		<div class="stage">
			{#if finished && answer?.poster_path}
				<img class="poster rise" src={imageUrl(answer.poster_path, 'w342')} alt="" />
			{/if}
			<ol
				class="clues"
				class:shaking
				onanimationend={() => (shaking = false)}
				aria-label="Emoji clues"
			>
				{#each { length: puzzle.slots }, index (index)}
					<li class:locked={!puzzle.emoji[index]}>
						{#if puzzle.emoji[index]}
							<span class="emoji">{puzzle.emoji[index]}</span>
						{/if}
					</li>
				{/each}
			</ol>
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
					{#if missed}<span class="missed">Not “{missed}”.</span>{/if}
					<span>{plural(left, 'guess', 'guesses')} left</span>
					{#if puzzle.year}<span class="hint">Released {puzzle.year}</span>{/if}
				</p>
				<MovieGuess onpick={submit} placeholder="Which film is this?" up />
			{/if}
		</div>
	{/if}
</GameShell>

<style>
	.stage {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(12px, 3vh, 28px);
		min-height: 0;
	}

	.loading {
		width: 100%;
		height: 100%;
	}

	.poster {
		flex: 0 1 auto;
		min-height: 0;
		max-height: 34vh;
		object-fit: contain;
		border-radius: var(--radius-md);
	}

	.clues {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: clamp(4px, 1vw, 12px);
		width: min(100%, 860px);
	}

	.clues.shaking {
		animation: shake 380ms var(--ease);
	}

	.clues li {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		background: var(--surface);
		border-radius: var(--radius-md);
		container-type: inline-size;
	}

	.clues li.locked {
		background: rgb(255 255 255 / 0.03);
		outline: 1px dashed var(--line-strong);
		outline-offset: -1px;
	}

	.emoji {
		font-size: 62cqw;
		line-height: 1;
		animation: pop 460ms var(--spring) both;
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

	.hint {
		color: var(--text);
	}

	/* Seven in a line would be tiny on a phone: two rows keep each clue readable. */
	@media (max-width: 560px) {
		.clues {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			width: min(100%, 44vh);
		}

		.clues li {
			flex: 0 0 calc(25% - 6px);
		}
	}
</style>
