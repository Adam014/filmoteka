<script>
	import { buzz, celebrate } from '#lib/actions/motion.js';
	import Countdown from '#lib/components/Countdown.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import MovieGuess from '#lib/components/MovieGuess.svelte';
	import ShareButton from '#lib/components/ShareButton.svelte';
	import {
		MAX_GUESSES,
		guess,
		isCorrectGuess,
		isFinished,
		newGame,
		posterBlur,
		skip
	} from '#lib/game.js';
	import { formatDate, plural } from '#lib/format.js';
	import { nextGame } from '#lib/games/catalog.js';
	import { imageUrl, posterSrcset } from '#lib/media.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { loadGame, saveGame } from '#lib/state/games.js';
	import { untrack } from 'svelte';

	let { data } = $props();

	const next = nextGame('daily');

	let game = $state(newGame());
	let restored = $state(false);
	let wrong = $state('');
	let requestId = 0;

	let challenge = $derived(data.challenge);
	let finished = $derived(isFinished(game));
	let shareText = $derived.by(() => {
		if (!finished) return '';
		const used = MAX_GUESSES - game.guessesLeft;
		const squares = '🟥'.repeat(used) + (game.guessedCorrectly ? '🟩' : '');
		const score = game.guessedCorrectly ? `${used + 1}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
		return `Filmoteka Poster #${data.day} ${score}\n${squares}\n${location.origin}/games/daily`;
	});
	let genres = $derived((challenge.genres ?? []).map((item) => item.name).join(', '));
	let hints = $derived(
		[
			{ label: 'Released', value: formatDate(challenge.release_date) || 'Unknown' },
			{ label: 'Genres', value: genres || 'Unknown' },
			{ label: 'Tagline', value: challenge.tagline || 'This film has no tagline' }
		].filter((_, index) => finished || index < game.currentHint)
	);

	$effect(() => {
		const day = data.day;
		const userId = auth.user?.id;
		if (!auth.ready) return;
		untrack(async () => {
			const id = ++requestId;
			restored = false;
			game = newGame();
			wrong = '';
			const saved = await loadGame(userId ? auth.user : null, day);
			if (id !== requestId) return;
			if (saved) game = saved;
			restored = true;
		});
	});

	function play(state) {
		game = state;
		saveGame(auth.user, data.day, $state.snapshot(state));
	}

	function submit(result) {
		const correct = isCorrectGuess(challenge, result);
		play(guess(game, correct));
		wrong = correct ? '' : result.title;
		if (correct) celebrate();
		else buzz(40);
	}

	function pass() {
		play(skip(game));
		wrong = '';
	}
</script>

<svelte:head>
	<title>Daily poster | Filmoteka</title>
</svelte:head>

<GameShell title="Daily poster">
	<div class="board">
		<div class="poster-area">
			<div class="poster">
				{#if restored}
					<img
						src={imageUrl(challenge.poster_path, 'w342')}
						srcset={posterSrcset(challenge.poster_path)}
						sizes="(max-width: 767px) 46vw, 440px"
						alt={finished ? `Poster of ${challenge.title}` : 'Blurred movie poster'}
						style:filter="blur({posterBlur(game)}px)"
						draggable="false"
					/>
				{:else}
					<div class="skeleton fill" aria-busy="true" aria-label="Loading your game"></div>
				{/if}
			</div>
		</div>

		{#if restored}
			<ol class="hints">
				{#each hints as hint (hint.label)}
					<li class="rise">
						<span class="label">{hint.label}</span>
						<span>{hint.value}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</div>

	{#if restored}
		<div class="dock">
			{#if finished}
				<div class="result rise" class:won={game.guessedCorrectly} role="status">
					<p class="verdict">{game.guessedCorrectly ? 'You got it' : 'The film was'}</p>
					<h2>{challenge.title}</h2>
				</div>
				<div class="actions">
					<ShareButton text={shareText} primary />
					<a class="btn" href="/movie/{challenge.films_id}">View film</a>
					<a class="btn btn-quiet" href={next.href}>Next: {next.name}</a>
				</div>
				<div class="count"><Countdown /></div>
			{:else}
				<p class="line" aria-live="polite">
					{#if wrong}<span class="wrong">Not “{wrong}”.</span>{/if}
					<span>{plural(game.guessesLeft, 'guess', 'guesses')} left</span>
				</p>
				<div class="row">
					<div class="slot"><MovieGuess onpick={submit} up /></div>
					<button class="btn" type="button" onclick={pass}>
						{game.guessesLeft === 1 ? 'Give up' : 'Skip'}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</GameShell>

<style>
	.board {
		display: flex;
		flex: 1;
		justify-content: center;
		gap: clamp(14px, 4vw, 48px);
		min-height: 0;
	}

	.poster-area {
		display: grid;
		flex: 1;
		place-items: center end;
		min-width: 0;
		min-height: 0;
		container-type: size;
	}

	.poster {
		width: min(100cqw, calc(100cqh * 2 / 3));
		aspect-ratio: 2 / 3;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
	}

	.poster img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Slightly enlarged so the blur never shows soft transparent edges. */
		transform: scale(1.08);
		transition: filter 600ms var(--ease);
		user-select: none;
	}

	.fill {
		width: 100%;
		height: 100%;
	}

	.hints {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 14px;
		min-width: 0;
		overflow-y: auto;
	}

	.hints li {
		display: grid;
		gap: 2px;
	}

	.label {
		color: var(--text-faint);
		font-size: 0.875rem;
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

	.wrong {
		color: var(--danger);
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

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}

	.count {
		margin-top: 8px;
	}

	/* Portrait: the poster fills what's left above its hints. */
	@media (max-width: 767px), (orientation: portrait) {
		.board {
			flex-direction: column;
			gap: 10px;
		}

		.poster-area {
			place-items: center;
		}

		.hints {
			flex: none;
			justify-content: flex-start;
			gap: 6px;
			max-height: 40%;
		}

		.hints li {
			grid-template-columns: 80px minmax(0, 1fr);
			gap: 8px;
		}
	}
</style>
