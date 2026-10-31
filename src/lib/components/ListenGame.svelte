<script>
	import { buzz, celebrate } from '../actions/motion.js';
	import { plural } from '../format.js';
	import { LISTEN_TIERS, passStatus } from '../games/listen.js';
	import { getPlay, getStreak, savePlay } from '../state/arcade.js';
	import { toast } from '../state/toast.svelte.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AudioClip from './AudioClip.svelte';
	import EmptyState from './EmptyState.svelte';
	import GameResult from './GameResult.svelte';
	import GameShell from './GameShell.svelte';
	import { findStart } from '../audio/findStart.js';

	/**
	 * The shared game behind Soundtrack and Earworm: five songs a day from easy to brutal, and on
	 * each one every miss lets you hear more.
	 */
	let {
		game,
		title,
		lead,
		picker,
		describe,
		closeNote = '',
		api = `/api/games/${game}`,
		daily = true,
		shareUrl = '',
		moreHref = '',
		moreLabel = '',
		back = undefined,
		backLabel = undefined,
		progress = undefined,
		onready = undefined,
		onfinish = undefined
	} = $props();

	const newRound = () => ({ guesses: [], status: 'playing', answer: null });

	let puzzle = $state(null);
	let failed = $state(false);
	let pending = $state(false);
	let rounds = $state([]);
	let index = $state(0);
	let streak = $state(0);
	let message = $state('');
	let close = $state(false);
	let found = $state({});

	let total = $derived(puzzle?.lengths.length ?? 0);
	let current = $derived(rounds[index]);
	let revealing = $derived(current && current.status !== 'playing');
	let step = $derived(current ? Math.min(current.guesses.length, Math.max(total - 1, 0)) : 0);
	let result = $derived(current?.answer ? describe(current.answer) : null);
	let score = $derived(rounds.filter((round) => round.status === 'won').length);
	let name = $derived(puzzle?.title ?? title);
	let start = $derived(puzzle?.rounds[index]?.start ?? found[index] ?? 0);
	let compact = $derived(rounds.length > LISTEN_TIERS.length);
	let share = $derived.by(() => {
		if (!puzzle || current) return '';
		const lines = rounds.map((round) =>
			round.guesses
				.map((item) => (item.correct ? '🟩' : item.close ? '🟨' : item.label ? '🟥' : '⬛'))
				.join('')
		);
		const number = daily ? ` #${puzzle.number}` : '';
		const header = `Filmoteka ${name}${number} ${score}/${rounds.length}`;
		const link = shareUrl || `${location.origin}/games/${game}`;
		return `${header}\n${lines.join('\n')}\n${link}`;
	});

	const seconds = (round) => puzzle.lengths[round.guesses.length - 1];
	const tierOf = (position) => puzzle?.rounds[position]?.tier ?? position;
	// Longer games pass on the same share of songs as the usual five.
	const statusFor = (value) => passStatus((value * LISTEN_TIERS.length) / (rounds.length || 1));

	async function load() {
		failed = false;
		puzzle = null;
		try {
			const response = await fetch(api);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const today = await response.json();
			const saved = getPlay(game, today.key);
			rounds = Array.isArray(saved?.rounds) ? saved.rounds : today.rounds.map(newRound);
			const open = rounds.findIndex((round) => round.status === 'playing');
			index = open === -1 ? rounds.length : open;
			puzzle = today;
			if (daily) streak = getStreak(game, today.key);
			onready?.(today);
		} catch {
			failed = true;
		}
	}

	onMount(load);

	// Songs we've never analysed, like those from a playlist, get their start worked out on the spot.
	$effect(() => {
		const position = index;
		const round = puzzle?.rounds[position];
		if (!round || round.start != null || found[position] !== undefined) return;
		findStart(round.clip, tierOf(position)).then((value) => {
			found = { ...found, [position]: value };
		});
	});

	/** Saved as soon as the last song is over, so a reload can't lose the final score. */
	function persist() {
		const over = rounds.every((round) => round.status !== 'playing');
		const status = over ? statusFor(score) : 'playing';
		savePlay(game, puzzle.key, $state.snapshot({ rounds, status, score }));
		if (over) onfinish?.(score);
		if (daily) streak = getStreak(game, puzzle.key);
	}

	async function submit(item) {
		if (pending || !current || revealing) return;
		if (item && current.guesses.some((guess) => guess.id === item.id)) {
			toast.info(`You already tried “${item.title}”.`);
			return;
		}
		pending = true;
		try {
			const response = await fetch(api, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					key: puzzle.key,
					round: index,
					attempt: current.guesses.length,
					id: item?.id ?? null
				})
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const outcome = await response.json();

			const guess = {
				id: item?.id ?? null,
				label: item?.title ?? null,
				correct: outcome.correct,
				close: Boolean(outcome.close)
			};
			const status = !outcome.finished ? 'playing' : outcome.correct ? 'won' : 'lost';
			rounds = rounds.map((round, position) =>
				position === index
					? { guesses: [...round.guesses, guess], status, answer: outcome.answer }
					: round
			);
			close = Boolean(outcome.close);
			message = item && !outcome.correct ? `Not “${item.title}”.` : '';
			if (item && !outcome.correct) buzz(40);
			if (outcome.correct) celebrate(24);
			persist();
			// The next key press belongs to the game, not to the button that was just used.
			if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
		} catch {
			toast.error("That guess didn't go through. Please try again.");
		} finally {
			pending = false;
		}
	}

	function advance() {
		index += 1;
		message = '';
		close = false;
		if (index === rounds.length && statusFor(score) === 'won') celebrate();
	}

	/** Space plays (in AudioClip), typing goes straight to the guess, Enter moves on. */
	function onkeydown(event) {
		if (!puzzle || event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target;
		const typing = target instanceof HTMLInputElement;
		if (event.key === 'Escape' && typing && !target.value) target.blur();
		if (event.key === 'Enter' && !(target instanceof HTMLAnchorElement)) {
			if (revealing) {
				event.preventDefault();
				advance();
			} else if (!current && moreHref && !typing && !(target instanceof HTMLButtonElement)) {
				event.preventDefault();
				goto(moreHref);
			}
			return;
		}
		if (!current || revealing || typing || event.key.length !== 1 || event.key === ' ') return;
		document.getElementById('guess')?.focus();
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{name} | Filmoteka</title>
	<meta name="description" content={lead} />
</svelte:head>

<GameShell title={name} {back} {backLabel}>
	{#snippet status()}
		{#if progress}<span>{@render progress()}</span>{/if}
		{#if streak > 1}<span>{streak}-day streak</span>{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="Today's clips didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={load}>Try again</button>
		</EmptyState>
	{:else if !puzzle}
		<div class="stage"><div class="skeleton loading" aria-busy="true"></div></div>
	{:else if !current}
		<ol class="recap rise">
			{#each rounds as round, position (position)}
				{@const song = describe(round.answer)}
				<li>
					<svelte:element this={song.href ? 'a' : 'div'} class="recap-row" href={song.href}>
						{#if song.image}<img src={song.image} alt="" />{/if}
						<span class="recap-text">
							<span class="recap-title">{song.heading}</span>
							<span class="recap-meta">
								<span style:color="var(--tier-{tierOf(position) + 1})"
									>{puzzle.rounds[position].label}</span
								>
								{song.note}
							</span>
						</span>
						<span class="recap-score" class:missed={round.status !== 'won'}>
							{round.status === 'won' ? `${seconds(round)}s` : 'Missed'}
						</span>
					</svelte:element>
				</li>
			{/each}
		</ol>
		<div class="dock">
			<GameResult
				{game}
				won={statusFor(score) === 'won'}
				verdict={!daily ? name : streak > 1 ? `${streak}-day streak` : 'Today'}
				heading="{score} of {rounds.length} songs"
				{share}
				{daily}
				href={moreHref}
				hrefLabel={moreLabel}
			>
				<p class="credit">Previews courtesy of Deezer.</p>
			</GameResult>
		</div>
	{:else}
		<div class="stage" style:--accent="var(--tier-{tierOf(index) + 1})">
			<ol class="tiers" aria-label="Difficulty">
				{#each rounds as round, position (position)}
					<li
						style:--tier="var(--tier-{tierOf(position) + 1})"
						class:current={position === index}
						class:won={position !== index && round.status === 'won'}
						class:lost={position !== index && round.status === 'lost'}
						aria-current={position === index ? 'step' : undefined}
					>
						{compact ? position + 1 : puzzle.rounds[position].label}
					</li>
				{/each}
			</ol>
			{#if revealing && result?.image}
				<img class="cover rise" src={result.image} alt="" />
			{/if}
			<AudioClip
				src={puzzle.rounds[index].clip}
				{start}
				limit={revealing ? 15 : puzzle.lengths[step]}
				reach={revealing ? 1 : (step + 1) / total}
				label={revealing ? 'Play the whole clip' : `Play ${puzzle.lengths[step]} seconds`}
			/>
			<ol class="ladder" aria-label="Clip lengths">
				{#each puzzle.lengths as length, position (length)}
					{@const played = current.guesses[position]}
					<li
						class:hit={played?.correct}
						class:near={played?.close}
						class:miss={played && !played.correct && !played.close && played.label}
						class:skipped={played && !played.label}
						class:current={!revealing && position === step}
					>
						{length}s
					</li>
				{/each}
			</ol>
		</div>

		<div class="dock" style:--accent="var(--tier-{tierOf(index) + 1})">
			{#if revealing}
				<div class="reveal rise" role="status">
					<p class="verdict" class:won={current.status === 'won'}>
						{current.status === 'won'
							? `Got it in ${plural(seconds(current), 'second')}`
							: 'It was'}
					</p>
					<h2>{result?.heading}</h2>
					<p class="note">
						{result?.note}
						{#if current.answer?.link}
							<a class="link" href={current.answer.link} target="_blank" rel="noreferrer">
								Deezer
							</a>
						{/if}
					</p>
					<button class="btn btn-primary btn-block" type="button" onclick={advance}>
						{index === rounds.length - 1 ? 'See your score' : 'Next song'}
					</button>
				</div>
			{:else}
				<p class="line" aria-live="polite">
					{#if message}<span class:missed={!close} class:nearly={close}>
							{message}{close && closeNote ? ` ${closeNote}` : ''}
						</span>{/if}
					<span>{plural(total - current.guesses.length, 'guess', 'guesses')} left</span>
				</p>
				<div class="row">
					<div class="slot">{@render picker(submit, puzzle)}</div>
					<button class="btn" type="button" disabled={pending} onclick={() => submit(null)}>
						{total - current.guesses.length === 1 ? 'Give up' : 'Skip'}
					</button>
				</div>
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

	.cover {
		flex: 0 1 auto;
		min-height: 0;
		max-width: 100%;
		max-height: 26vh;
		object-fit: contain;
		border-radius: var(--radius-md);
	}

	.ladder {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
	}

	.ladder li {
		display: grid;
		place-items: center;
		min-width: 48px;
		height: 36px;
		padding-inline: 8px;
		background: rgb(255 255 255 / 0.05);
		border-radius: 999px;
		color: var(--text-faint);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		transition:
			background-color 200ms var(--ease),
			color 200ms var(--ease);
	}

	.ladder .current {
		background: var(--text);
		color: var(--bg);
	}

	.ladder .hit {
		background: var(--success);
		color: var(--bg);
	}

	.ladder .near {
		background: var(--close);
		color: var(--bg);
	}

	.ladder .miss {
		background: color-mix(in srgb, var(--danger) 24%, transparent);
		color: var(--danger);
	}

	.ladder .skipped {
		color: var(--text-muted);
		text-decoration: line-through;
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

	.nearly {
		color: var(--close);
	}

	.row {
		display: flex;
		gap: 8px;
	}

	.slot {
		flex: 1;
		min-width: 0;
	}

	.credit {
		margin-top: 6px;
		color: var(--text-faint);
		font-size: 0.875rem;
	}
	.tiers {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
	}

	.tiers li {
		padding: 4px 10px;
		border-radius: 999px;
		color: var(--tier);
		font-size: 0.875rem;
		font-weight: 500;
		opacity: 0.85;
		transition:
			background-color 200ms var(--ease),
			color 200ms var(--ease),
			opacity 200ms var(--ease);
	}

	.tiers .current {
		background: var(--tier);
		color: var(--on-accent);
		font-weight: 600;
		opacity: 1;
	}

	.tiers .won {
		background: color-mix(in srgb, var(--tier) 22%, transparent);
		opacity: 1;
	}

	.tiers .lost {
		color: var(--text-faint);
		text-decoration: line-through;
		opacity: 1;
	}

	@media (max-width: 380px) {
		.tiers li {
			padding-inline: 7px;
		}
	}

	.verdict {
		color: var(--danger);
	}

	.verdict.won {
		color: var(--success);
	}

	h2 {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.note {
		margin-bottom: 10px;
		color: var(--text-muted);
	}

	.recap {
		display: grid;
		flex: 1;
		grid-auto-rows: minmax(52px, 72px);
		align-content: safe center;
		gap: 6px;
		width: min(100%, 680px);
		min-height: 0;
		margin-inline: auto;
		overflow-y: auto;
	}

	.recap :global(.recap-row) {
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

	.recap :global(a.recap-row:hover) {
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
		padding-left: 12px;
	}

	.recap img + .recap-text {
		padding-left: 0;
	}

	.recap-title,
	.recap-meta {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recap-title {
		font-weight: 500;
	}

	.recap-meta {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.recap-score {
		flex: none;
		color: var(--success);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.recap-score.missed {
		color: var(--danger);
	}

	@media (max-height: 640px) {
		.recap img {
			width: 64px;
		}
	}
</style>
