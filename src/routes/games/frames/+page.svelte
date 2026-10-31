<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import Countdown from '#lib/components/Countdown.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
	import { plural, yearOf } from '#lib/format.js';
	import { nextGame } from '#lib/games/catalog.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';

	const GAME = 'frames';
	const next = nextGame(GAME);

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let guesses = $state([]);
	let phase = $state('playing');
	let answer = $state(null);
	let viewing = $state(0);
	let streak = $state(0);
	let shaking = $state(false);
	let missed = $state('');

	let finished = $derived(phase !== 'playing');
	let left = $derived(puzzle ? puzzle.total - guesses.length : 0);
	let hint = $derived(
		puzzle
			? [puzzle.year && `Released ${puzzle.year}`, ...(puzzle.genres ?? [])].filter(Boolean)
			: []
	);
	let shareText = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const squares = guesses.map((item) => (item.correct ? '🟩' : '🟥')).join('');
		const score = phase === 'won' ? `${guesses.length}/${puzzle.total}` : `X/${puzzle.total}`;
		return `Filmoteka Frames #${puzzle.number} ${score}\n${squares}\n${location.origin}/games/frames`;
	});

	async function fetchStills(attempt, key = '') {
		const params = new URLSearchParams({ attempt: String(attempt) });
		if (key) params.set('key', key);
		const response = await fetch(`/api/games/frames?${params}`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const today = await fetchStills(0);
			const saved = getPlay(GAME, today.key);
			if (saved) {
				guesses = saved.guesses;
				phase = saved.status;
				answer = saved.answer;
			}
			const attempt = saved && saved.status !== 'playing' ? today.total - 1 : guesses.length;
			puzzle = attempt ? await fetchStills(attempt, today.key) : today;
			viewing = puzzle.stills.length - 1;
			streak = getStreak(GAME, today.key);
		} catch {
			failed = true;
		}
	}

	onMount(start);

	async function submit(result) {
		if (pending || finished) return;
		if (result && guesses.some((item) => item.id === result.id)) {
			toast.info(`You already tried “${result.title}”.`);
			return;
		}

		pending = true;
		try {
			const attempt = guesses.length;
			const response = await fetch('/api/games/frames', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, attempt, id: result?.id ?? null })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();

			const stills = await fetchStills(
				outcome.finished ? puzzle.total - 1 : attempt + 1,
				puzzle.key
			);
			guesses = [
				...guesses,
				{ id: result?.id ?? null, title: result?.title ?? null, correct: outcome.correct }
			];
			if (outcome.finished) {
				phase = outcome.correct ? 'won' : 'lost';
				answer = outcome.answer;
			}
			puzzle = stills;
			missed = result && !outcome.correct ? result.title : '';
			if (result && !outcome.correct) {
				shaking = true;
				buzz(40);
			}
			if (!outcome.correct) viewing = outcome.finished ? viewing : stills.stills.length - 1;
			if (outcome.correct) celebrate();
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
	<title>Frames | Filmoteka</title>
	<meta name="description" content="Name the film from a single still. A new one every day." />
</svelte:head>

<GameShell title="Frames">
	{#snippet status()}
		{#if streak > 1}<span>{streak}-day streak</span>{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's reel didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else}
		<div class="stage">
			<div class="view">
				<div class="frame" class:shaking onanimationend={() => (shaking = false)}>
					{#if puzzle}
						{#key puzzle.stills[viewing]}
							<img
								src={imageUrl(puzzle.stills[viewing], 'w1280')}
								alt="Frame {viewing + 1} from today's film"
								draggable="false"
								onload={(event) => event.currentTarget.classList.add('shown')}
							/>
						{/key}
					{:else}
						<div class="skeleton fill" aria-busy="true" aria-label="Loading today's frames"></div>
					{/if}
				</div>
			</div>

			<ol class="reel" aria-label="Frames">
				{#each { length: puzzle?.total ?? 6 }, index (index)}
					{@const still = puzzle?.stills[index]}
					{@const played = guesses[index]}
					<li>
						<button
							type="button"
							disabled={!still}
							class:current={index === viewing}
							class:miss={played && !played.correct && played.title}
							class:skipped={played && !played.title}
							class:hit={played?.correct}
							aria-label="Frame {index + 1}{still ? '' : ', locked'}"
							aria-current={index === viewing}
							onclick={() => (viewing = index)}
						>
							{#if still}
								<img src={imageUrl(still, 'w300')} alt="" draggable="false" />
							{:else}
								{index + 1}
							{/if}
						</button>
					</li>
				{/each}
			</ol>
		</div>

		{#if puzzle}
			<div class="dock">
				{#if finished}
					<div class="result rise" class:won={phase === 'won'} role="status">
						<p class="verdict">
							{phase === 'won'
								? `Got it in ${plural(guesses.length, 'guess', 'guesses')}`
								: 'The film was'}
						</p>
						<h2>
							{answer?.title}
							{#if yearOf(answer?.date)}<span>{yearOf(answer.date)}</span>{/if}
						</h2>
					</div>
					<div class="actions">
						<ShareButton text={shareText} primary />
						{#if answer}<a class="btn" href="/movie/{answer.id}">View film</a>{/if}
						<a class="btn btn-quiet" href={next.href}>Next: {next.name}</a>
					</div>
					<Countdown />
				{:else}
					<p class="line" aria-live="polite">
						{#if missed}
							<span class="missed">Not “{missed}”.</span>
						{/if}
						<span>{plural(left, 'guess', 'guesses')} left</span>
						{#if hint.length}<span class="hint">{hint.join(' · ')}</span>{/if}
					</p>
					<div class="row">
						<div class="slot">
							<MovieGuess onpick={submit} placeholder="Which film is this?" up />
						</div>
						<button class="btn" type="button" disabled={pending} onclick={() => submit(null)}>
							{left === 1 ? 'Give up' : 'Skip'}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</GameShell>

<style>
	.stage {
		display: grid;
		flex: 1;
		grid-template-columns: minmax(0, 1fr) clamp(112px, 12vw, 172px);
		gap: 10px;
		min-height: 0;
	}

	.view {
		display: grid;
		place-items: start center;
		min-height: 0;
		container-type: size;
	}

	.frame {
		width: min(100cqw, calc(100cqh * 16 / 9));
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
	}

	.frame.shaking {
		animation: shake 380ms var(--ease);
	}

	.frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		clip-path: circle(0% at 50% 50%);
		user-select: none;
	}

	/* Every new frame opens like a camera iris. */
	.frame img:global(.shown) {
		animation: iris 720ms var(--ease) both;
	}

	@keyframes iris {
		from {
			clip-path: circle(0% at 50% 50%);
			transform: scale(1.04);
		}
		to {
			clip-path: circle(75% at 50% 50%);
			transform: none;
		}
	}

	.fill {
		width: 100%;
		height: 100%;
	}

	.reel {
		display: grid;
		grid-template-rows: repeat(6, minmax(0, 1fr));
		gap: 8px;
		min-height: 0;
	}

	.reel li {
		min-height: 0;
	}

	.reel button {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-sm);
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
		outline: 2px solid transparent;
		outline-offset: -2px;
		transition:
			outline-color 140ms var(--ease),
			transform 300ms var(--spring);
	}

	.reel button:hover:not(:disabled) {
		transform: scale(1.03);
	}

	.reel img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		animation: fade 400ms var(--ease);
	}

	.reel .current {
		outline-color: var(--text);
	}

	/* A coloured edge records how that attempt went. */
	.reel button::after {
		content: '';
		position: absolute;
		inset: auto 0 0;
		height: 4px;
		background: transparent;
	}

	.reel .miss::after {
		background: var(--danger);
	}

	.reel .skipped::after {
		background: var(--text-faint);
	}

	.reel .hit::after {
		background: var(--success);
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

	.row {
		display: flex;
		gap: 8px;
	}

	.slot {
		flex: 1;
		min-width: 0;
	}

	.verdict {
		color: var(--danger);
	}

	.won .verdict {
		color: var(--success);
	}

	h2 {
		font-size: clamp(1.375rem, 3vw, 2rem);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	h2 span {
		color: var(--text-faint);
		font-weight: 400;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-block: 10px 8px;
	}

	/* Portrait: the frame runs full width and the rest of the height becomes a contact sheet. */
	@media (max-width: 767px), (orientation: portrait) {
		.stage {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
		}

		.view {
			container-type: normal;
		}

		.frame {
			width: 100%;
		}

		.reel {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			grid-template-rows: repeat(2, minmax(0, 1fr));
		}
	}
</style>
