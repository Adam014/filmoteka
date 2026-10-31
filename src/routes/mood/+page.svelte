<script>
	import { navigating } from '$app/state';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import { ERAS, LENGTHS, MOODS } from '#lib/moods.js';

	let { data } = $props();

	let mood = $derived(MOODS.find((item) => item.id === data.moodId));
	let busy = $derived(navigating.to?.route.id === '/mood');

	function href(changes) {
		const next = { mood: data.moodId, length: data.length, era: data.era, spin: 0, ...changes };
		const params = new URLSearchParams({ mood: next.mood });
		if (next.length !== 'any') params.set('length', next.length);
		if (next.era !== 'any') params.set('era', next.era);
		if (next.spin) params.set('spin', String(next.spin));
		return `/mood?${params}`;
	}
</script>

<svelte:head>
	<title>{mood.label} films | Filmoteka</title>
	<meta name="description" content="Find a film that fits how you feel tonight." />
</svelte:head>

<div class="container page">
	<h1 class="page-title">What are you in the mood for?</h1>

	<div data-sveltekit-reset="false">
		<ul class="chips moods" aria-label="Mood">
			{#each MOODS as item (item.id)}
				<li>
					<a
						class="chip"
						href={href({ mood: item.id })}
						aria-current={item.id === data.moodId ? 'true' : undefined}
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="filters">
			<ul class="chips" aria-label="Length">
				{#each LENGTHS as item (item.id)}
					<li>
						<a
							class="chip"
							href={href({ length: item.id })}
							aria-current={item.id === data.length ? 'true' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
			<ul class="chips" aria-label="Era">
				{#each ERAS as item (item.id)}
					<li>
						<a
							class="chip"
							href={href({ era: item.id })}
							aria-current={item.id === data.era ? 'true' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div class="summary">
			{#key mood.id}
				<p class="rise">{mood.line}</p>
			{/key}
			<a class="btn" href={href({ spin: data.spin + 1 })}>
				<Icon name="shuffle" size={18} />Show me others
			</a>
		</div>
	</div>

	{#if data.movies.length}
		{#key `${data.moodId}-${data.length}-${data.era}-${data.spin}`}
			<div class="media-grid results rise" class:busy>
				{#each data.movies as movie (movie.id)}
					<MediaCard media={movie} />
				{/each}
			</div>
		{/key}
	{:else if data.failed}
		<EmptyState title="We couldn't fetch films right now">
			<p>Give it another go in a moment.</p>
			<a class="btn" href={href({})}>Try again</a>
		</EmptyState>
	{:else}
		<EmptyState title="Nothing fits all of that">
			<p>Try another length or era.</p>
			<a class="btn" href={href({ length: 'any', era: 'any' })}>Clear filters</a>
		</EmptyState>
	{/if}
</div>

<style>
	.chips {
		display: flex;
		gap: 8px;
		margin-inline: calc(var(--gutter) * -1);
		padding-inline: var(--gutter);
		padding-block: 4px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.chips::-webkit-scrollbar {
		display: none;
	}

	.moods {
		flex-wrap: wrap;
		margin-top: 20px;
	}

	.filters {
		display: grid;
		gap: 4px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}

	.filters .chip {
		min-height: 40px;
		font-size: 0.875rem;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px 24px;
		margin-top: 20px;
		color: var(--text-muted);
	}

	.results {
		margin-top: 20px;
		transition: opacity 200ms var(--ease);
	}

	.results.busy {
		opacity: 0.45;
	}
</style>
