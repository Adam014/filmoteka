<script>
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { gameStatus } from '#lib/game.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { loadAllGames } from '#lib/state/games.js';
	import { untrack } from 'svelte';

	const LABELS = { won: 'Solved', lost: 'Missed', playing: 'In progress', new: 'Not played' };

	let { data } = $props();

	let games = $state(new Map());

	$effect(() => {
		if (!auth.ready) return;
		const userId = auth.user?.id;
		const days = data.days ?? [];
		untrack(async () => {
			games = await loadAllGames(userId ? auth.user : null, days);
		});
	});

	let solved = $derived([...games.values()].filter((game) => game.guessedCorrectly).length);
	const statusOf = (day) => gameStatus(games.get(day));
</script>

<svelte:head>
	<title>Daily challenge | Filmoteka</title>
	<meta name="description" content="Name the film from a blurred poster in three guesses." />
</svelte:head>

<div class="container page">
	<h1 class="page-title">Daily challenge</h1>
	<p class="page-lede">
		Name the film from a blurred poster in three guesses. Every miss sharpens the picture and
		reveals a new hint.
	</p>

	{#if !data.days}
		<EmptyState title="The challenges didn't load">
			<p>We couldn't reach the game right now. Please try again in a moment.</p>
			<a class="btn" href="/games/daily" data-sveltekit-reload>Try again</a>
		</EmptyState>
	{:else if !data.days.length}
		<EmptyState title="No challenges yet">
			<p>The first one is on its way.</p>
		</EmptyState>
	{:else}
		<p class="progress">{solved} of {data.days.length} solved</p>
		<ul class="days">
			{#each data.days as day (day)}
				{@const status = statusOf(day)}
				<li>
					<a href="/games/daily/day-{day}" class={status}>
						<span class="number">{day}</span>
						<span class="status">
							{#if status === 'won'}<Icon name="check" size={16} />{/if}
							{#if status === 'lost'}<Icon name="close" size={16} />{/if}
							{LABELS[status]}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.progress {
		margin-top: 32px;
		color: var(--text-faint);
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(136px, 42vw), 1fr));
		gap: 1px;
		margin-top: 12px;
		overflow: hidden;
		background: var(--line);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
	}

	a {
		display: grid;
		gap: 6px;
		height: 100%;
		padding: 16px;
		background: var(--bg);
		transition: background-color 160ms var(--ease);
	}

	a:hover {
		background: var(--surface);
	}

	a:focus-visible {
		outline-offset: -2px;
	}

	.number {
		font-size: 1.75rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.won .status {
		color: var(--success);
	}

	.lost .status {
		color: var(--danger);
	}

	.playing .status {
		color: var(--accent);
	}
</style>
