<script>
	import { spotlight } from '../actions/motion.js';
	import { dayKey } from '../games/seed.js';
	import { imageUrl } from '../media.js';
	import { getBest, getPlay } from '../state/arcade.js';
	import { BEST_KEY, ROUNDS } from '../games/higherLower.js';
	import { onMount } from 'svelte';

	let { games } = $props();
	let notes = $state({});

	const dailyNote = (game) => {
		const status = getPlay(game, dayKey())?.status;
		if (status === 'won') return 'Solved today';
		if (status === 'lost') return 'Played today';
		return status === 'playing' ? 'In progress' : '';
	};

	onMount(() => {
		const best = getBest(BEST_KEY);
		notes = {
			frames: dailyNote('frames'),
			connections: dailyNote('connections'),
			'higher-lower': best ? `Best ${best}/${ROUNDS}` : ''
		};
	});
</script>

<ul class="tiles" use:spotlight>
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
		gap: 12px;
		margin-top: 20px;
	}

	li {
		position: relative;
	}

	a {
		position: relative;
		display: flex;
		align-items: flex-end;
		height: 100%;
		min-height: 260px;
		overflow: hidden;
		isolation: isolate;
		background: var(--surface);
		border-radius: var(--radius-md);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		transition:
			transform 420ms var(--spring),
			outline-color 200ms var(--ease);
	}

	a:hover {
		transform: translateY(-4px);
		outline-color: var(--line-strong);
	}

	img {
		position: absolute;
		z-index: -2;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.42;
		transition:
			opacity 320ms var(--ease),
			transform 900ms var(--ease);
	}

	a:hover img {
		opacity: 0.62;
		transform: scale(1.05);
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
				rgb(255 255 255 / 0.13),
				transparent 62%
			),
			linear-gradient(to top, rgb(10 10 11 / 0.92), rgb(10 10 11 / 0.1) 76%);
	}

	.copy {
		display: grid;
		gap: 6px;
		padding: 20px;
	}

	.name {
		font-size: 1.375rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.blurb {
		color: rgb(245 245 246 / 0.82);
		font-size: 0.9375rem;
	}

	.note {
		color: var(--text-muted);
		font-size: 0.875rem;
	}
</style>
