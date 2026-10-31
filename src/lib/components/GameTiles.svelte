<script>
	import { spotlight } from '../actions/motion.js';
	import { gameStatus, gameStorageKey, parseSavedGame } from '../game.js';
	import { dayKey } from '../games/seed.js';
	import { ROUNDS } from '../games/higherLower.js';
	import { imageUrl } from '../media.js';
	import { getPlay } from '../state/arcade.js';
	import { onMount } from 'svelte';

	/** `bento` gives the first game a large tile, `even` makes them all the same size. */
	let { games, variant = 'even' } = $props();
	let notes = $state({});

	const LABELS = { won: 'Solved today', lost: 'Played today', playing: 'In progress' };

	function posterStatus(day) {
		if (!day) return null;
		try {
			return gameStatus(parseSavedGame(localStorage.getItem(gameStorageKey(day))));
		} catch {
			return null;
		}
	}

	onMount(() => {
		const today = dayKey();
		const highLow = getPlay('higher-lower', today);
		const score = highLow?.marks?.filter((mark) => mark === 'right').length;
		const scored = (game, max) => {
			const play = getPlay(game, today);
			if (!play) return undefined;
			return play.status === 'playing' ? LABELS.playing : `Today ${play.score}/${max}`;
		};
		notes = {
			...Object.fromEntries(
				['frames', 'connections', 'filmle', 'emoji'].map((game) => [
					game,
					LABELS[getPlay(game, today)?.status]
				])
			),
			soundtrack: scored('soundtrack', 5),
			earworm: scored('earworm', 5),
			grid: scored('grid', 9),
			year: scored('year', 1000),
			daily: LABELS[posterStatus(games.find((game) => game.slug === 'daily')?.posterDay)],
			'higher-lower':
				highLow?.status === 'playing' ? LABELS.playing : highLow && `Today ${score}/${ROUNDS}`
		};
	});
</script>

<ul class="tiles {variant}" use:spotlight>
	{#each games as game (game.slug)}
		<li>
			<a href={game.href}>
				{#if game.image}
					<img src={imageUrl(game.image, 'w780')} alt="" loading="lazy" />
				{/if}
				<span class="copy">
					<span class="name">{game.name}</span>
					<span class="blurb">{game.blurb}</span>
					{#if notes[game.slug]}<span class="note">{notes[game.slug]}</span>{/if}
				</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.tiles {
		display: grid;
		gap: 10px;
	}

	.bento {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(190px, 25vh);
	}

	.bento li:first-child {
		grid-column: span 2;
		grid-row: span 2;
	}

	.even {
		grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
		grid-auto-rows: clamp(170px, 22vh, 230px);
	}

	li {
		position: relative;
		min-width: 0;
	}

	a {
		position: relative;
		display: flex;
		align-items: flex-end;
		height: 100%;
		overflow: hidden;
		isolation: isolate;
		background: var(--surface);
		border-radius: var(--radius-lg);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		transition: transform 420ms var(--spring);
	}

	a:hover {
		transform: scale(0.985);
	}

	img {
		position: absolute;
		z-index: -2;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.55;
		transition:
			opacity 320ms var(--ease),
			transform 900ms var(--ease);
	}

	a:hover img {
		opacity: 0.8;
		transform: scale(1.06);
	}

	/* A soft light that follows the pointer: see the spotlight action. */
	a::before {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 0;
		background:
			radial-gradient(
				420px circle at var(--sx, 50%) var(--sy, 0%),
				rgb(255 255 255 / 0.12),
				transparent 62%
			),
			linear-gradient(to top, rgb(8 9 11 / 0.82), rgb(8 9 11 / 0.05) 72%);
	}

	.copy {
		display: grid;
		gap: 4px;
		padding: clamp(16px, 2vw, 24px);
	}

	.name {
		font-size: clamp(1.25rem, 2vw, 1.625rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		transition: color 160ms var(--ease);
	}

	.bento li:first-child .name {
		font-size: clamp(1.75rem, 3.4vw, 3rem);
		letter-spacing: -0.04em;
	}

	a:hover .name {
		color: var(--accent);
	}

	.blurb {
		color: rgb(246 247 248 / 0.8);
		font-size: 0.9375rem;
	}

	.note {
		margin-top: 2px;
		color: var(--accent);
		font-size: 0.875rem;
		font-weight: 500;
	}

	@media (max-width: 900px) {
		.bento {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-auto-rows: 170px;
		}

		.bento li:first-child {
			grid-row: span 1;
		}
	}
</style>
