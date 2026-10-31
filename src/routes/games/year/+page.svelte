<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import CountUp from '#lib/components/CountUp.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameResult from '#lib/components/GameResult.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import Pips from '#lib/components/Pips.svelte';
	import { ROUND_POINTS, YEAR_MAX, YEAR_MIN, YEAR_ROUNDS, yearSquare } from '#lib/games/year.js';
	import { imageUrl } from '#lib/media.js';
	import { getPlay, getStreak, savePlay } from '#lib/state/arcade.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { onMount } from 'svelte';

	const GAME = 'year';
	const MIDDLE = Math.round((YEAR_MIN + YEAR_MAX) / 2);

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let rounds = $state([]);
	let guess = $state(MIDDLE);
	let reveal = $state(null);
	let phase = $state('playing');
	let streak = $state(0);

	let index = $derived(rounds.length - (reveal ? 1 : 0));
	let score = $derived(rounds.reduce((sum, round) => sum + round.points, 0));
	let finished = $derived(phase !== 'playing');
	let marks = $derived(
		rounds.map((round) => (round.points >= 60 ? 'right' : 'wrong')).slice(0, YEAR_ROUNDS)
	);
	let share = $derived.by(() => {
		if (!puzzle || !finished) return '';
		const squares = rounds.map((round) => yearSquare(round.points)).join('');
		return `Filmoteka Year #${puzzle.number} ${score}/${YEAR_ROUNDS * ROUND_POINTS}\n${squares}\n${location.origin}/games/year`;
	});

	const outcomeOf = (total) => (total >= (YEAR_ROUNDS * ROUND_POINTS) / 2 ? 'won' : 'lost');
	const place = (year) => ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
	const nudge = (by) => (guess = clamp(guess + by));
	const clamp = (year) => Math.min(Math.max(Math.round(year) || MIDDLE, YEAR_MIN), YEAR_MAX);

	async function start() {
		failed = false;
		puzzle = null;
		try {
			const response = await fetch('/api/games/year');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const today = await response.json();
			const saved = getPlay(GAME, today.key);
			if (saved) {
				rounds = saved.rounds;
				phase = saved.status;
			}
			puzzle = today;
			streak = getStreak(GAME, today.key);
		} catch {
			failed = true;
		}
	}

	onMount(start);

	/** Saved as soon as the last round is in, so a reload can't lose the final score. */
	function persist() {
		const status = rounds.length === YEAR_ROUNDS ? outcomeOf(score) : 'playing';
		savePlay(GAME, puzzle.key, $state.snapshot({ rounds, status, score }));
		streak = getStreak(GAME, puzzle.key);
	}

	async function submit() {
		if (pending || finished || reveal) return;
		pending = true;
		const year = clamp(guess);
		try {
			const response = await fetch('/api/games/year', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: puzzle.key, round: rounds.length, year })
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();
			reveal = { ...outcome, guess: year };
			rounds = [...rounds, reveal];
			if (outcome.points === ROUND_POINTS) celebrate(24);
			else if (outcome.points < 60) buzz(40);
			persist();
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}

	function advance() {
		reveal = null;
		guess = MIDDLE;
		if (rounds.length === YEAR_ROUNDS) {
			phase = outcomeOf(score);
			if (phase === 'won') celebrate();
		}
	}

	function verdict(total) {
		if (total >= 800) return 'You could run a cinematheque';
		if (total >= 500) return 'A solid film memory';
		if (total >= 250) return 'Decent, for a casual viewer';
		return 'Time for a film marathon';
	}
</script>

<svelte:head>
	<title>Year | Filmoteka</title>
	<meta name="description" content="Five stills. How close can you get to the year of each film?" />
</svelte:head>

<GameShell title="Year">
	{#snippet status()}
		<Pips total={YEAR_ROUNDS} {marks} label="Rounds" />
	{/snippet}

	{#if failed}
		<EmptyState title="Today's stills didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={start}>Try again</button>
		</EmptyState>
	{:else if !puzzle}
		<div class="stage"><div class="skeleton loading" aria-busy="true"></div></div>
	{:else if finished}
		<ol class="recap rise">
			{#each rounds as round, position (round.id)}
				<li style:--i={position}>
					<a href="/movie/{round.id}">
						<img src={imageUrl(puzzle.stills[position], 'w300')} alt="" />
						<span class="recap-text">
							<span class="recap-title">{round.title}</span>
							<span class="recap-meta">{round.actual}, you said {round.guess}</span>
						</span>
						<span class="recap-points">{round.points}</span>
					</a>
				</li>
			{/each}
		</ol>
		<div class="dock">
			<GameResult
				game={GAME}
				won={phase === 'won'}
				verdict={verdict(score)}
				heading="{score} / {YEAR_ROUNDS * ROUND_POINTS}"
				note={streak > 1 ? `${streak}-day streak` : ''}
				{share}
			/>
		</div>
	{:else}
		<div class="stage">
			<div class="frame">
				{#key puzzle.stills[index]}
					<img
						class="rise"
						src={imageUrl(puzzle.stills[index], 'w1280')}
						alt="A still from film {index + 1}"
						draggable="false"
					/>
				{/key}
			</div>
		</div>

		<div class="dock">
			{#if reveal}
				<div class="reveal rise" role="status">
					<div class="reveal-head">
						<div class="reveal-film">
							<p class="reveal-title">{reveal.title}</p>
							<p class="reveal-meta">{reveal.actual}, you said {reveal.guess}</p>
						</div>
						<p class="reveal-points">
							+<CountUp value={reveal.points} duration={700} />
						</p>
					</div>
					<div class="track" aria-hidden="true">
						<span class="pin yours" style:left="{place(reveal.guess)}%"></span>
						<span class="pin real" style:left="{place(reveal.actual)}%"></span>
					</div>
					<button class="btn btn-primary btn-block" type="button" onclick={advance}>
						{rounds.length === YEAR_ROUNDS ? 'See your score' : 'Next film'}
					</button>
				</div>
			{:else}
				<div class="picker">
					<button
						class="btn step"
						type="button"
						aria-label="One year earlier"
						onclick={() => nudge(-1)}
					>
						−
					</button>
					<input
						class="year-input"
						type="number"
						inputmode="numeric"
						min={YEAR_MIN}
						max={YEAR_MAX}
						aria-label="Year"
						bind:value={guess}
						onblur={() => (guess = clamp(guess))}
						onkeydown={(event) => event.key === 'Enter' && submit()}
					/>
					<button
						class="btn step"
						type="button"
						aria-label="One year later"
						onclick={() => nudge(1)}
					>
						+
					</button>
				</div>
				<input
					class="slider"
					type="range"
					min={YEAR_MIN}
					max={YEAR_MAX}
					aria-label="Year slider"
					bind:value={guess}
					style:--fill="{place(clamp(guess))}%"
				/>
				<button class="btn btn-primary btn-block" type="button" disabled={pending} onclick={submit}>
					Lock in {clamp(guess)}
				</button>
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

	.frame {
		width: min(100cqw, calc(100cqh * 16 / 9));
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
	}

	.frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
	}

	.dock {
		flex: none;
		width: min(100%, 680px);
		margin: 12px auto 0;
	}

	.picker {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.step {
		width: 44px;
		padding: 0;
		font-size: 1.25rem;
	}

	.year-input {
		width: 4.2ch;
		padding: 0;
		background: none;
		border: 0;
		color: var(--text);
		font: inherit;
		font-size: clamp(2.25rem, 7vh, 3.5rem);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		text-align: center;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.year-input::-webkit-inner-spin-button,
	.year-input::-webkit-outer-spin-button {
		appearance: none;
		margin: 0;
	}

	.year-input:focus-visible {
		outline: none;
		color: var(--accent);
	}

	.slider {
		display: block;
		width: 100%;
		height: 32px;
		margin-block: 4px 8px;
		background: none;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
	}

	.slider::-webkit-slider-runnable-track {
		height: 6px;
		background: linear-gradient(
			to right,
			var(--accent) var(--fill),
			rgb(255 255 255 / 0.14) var(--fill)
		);
		border-radius: 999px;
	}

	.slider::-moz-range-track {
		height: 6px;
		background: linear-gradient(
			to right,
			var(--accent) var(--fill),
			rgb(255 255 255 / 0.14) var(--fill)
		);
		border-radius: 999px;
	}

	.slider::-webkit-slider-thumb {
		width: 28px;
		height: 28px;
		margin-top: -11px;
		background: var(--text);
		border-radius: 50%;
		box-shadow: 0 2px 10px rgb(0 0 0 / 0.5);
		appearance: none;
		-webkit-appearance: none;
	}

	.slider::-moz-range-thumb {
		width: 28px;
		height: 28px;
		background: var(--text);
		border: 0;
		border-radius: 50%;
	}

	.reveal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.reveal-title {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.reveal-meta {
		color: var(--text-muted);
	}

	.reveal-points {
		flex: none;
		color: var(--accent);
		font-size: 2.25rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.track {
		position: relative;
		height: 6px;
		margin-block: 18px 16px;
		background: rgb(255 255 255 / 0.14);
		border-radius: 999px;
	}

	.pin {
		position: absolute;
		top: 50%;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: pop 420ms var(--spring) both;
	}

	.yours {
		background: var(--text);
	}

	.real {
		background: var(--accent);
		animation-delay: 180ms;
	}

	.recap {
		display: grid;
		flex: 1;
		grid-auto-rows: minmax(0, 72px);
		align-content: center;
		gap: 6px;
		width: min(100%, 680px);
		min-height: 0;
		margin-inline: auto;
	}

	.recap a {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 100%;
		padding-right: 12px;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
		transition: background-color 160ms var(--ease);
	}

	.recap a:hover {
		background: var(--surface-raised);
	}

	.recap img {
		flex: none;
		width: 96px;
		height: 100%;
		object-fit: cover;
	}

	.recap-text {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.recap-title {
		overflow: hidden;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recap-meta {
		color: var(--text-muted);
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.recap-points {
		color: var(--accent);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	@media (max-height: 640px) {
		.recap img {
			width: 64px;
		}
	}
</style>
