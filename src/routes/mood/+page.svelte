<script>
	import { navigating } from '$app/state';
	import ActiveFilters from '#lib/components/ActiveFilters.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FilterMenu from '#lib/components/FilterMenu.svelte';
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

	let lengths = $derived(LENGTHS.map((item) => ({ ...item, href: href({ length: item.id }) })));
	let eras = $derived(ERAS.map((item) => ({ ...item, href: href({ era: item.id }) })));
	let active = $derived([
		...(data.length === 'any'
			? []
			: [
					{
						key: 'length',
						label: LENGTHS.find((item) => item.id === data.length)?.label,
						href: href({ length: 'any' })
					}
				]),
		...(data.era === 'any'
			? []
			: [
					{
						key: 'era',
						label: ERAS.find((item) => item.id === data.era)?.label,
						href: href({ era: 'any' })
					}
				])
	]);
</script>

<svelte:head>
	<title>{mood.label} films | Filmoteka</title>
	<meta name="description" content="Find a film that fits how you feel tonight." />
</svelte:head>

<div class="mood-page" style:--mood={mood.color}>
	<div class="glow" aria-hidden="true"></div>
	<div class="container page">
		<h1 class="page-title">
			Tonight feels
			<span class="current"
				>{#key mood.id}<span class="word">{mood.label.toLowerCase()}</span>{/key}</span
			>
		</h1>

		<div data-sveltekit-reset="false">
			<ul class="moods" aria-label="Mood">
				{#each MOODS as item (item.id)}
					<li>
						<a
							class="chip"
							href={href({ mood: item.id })}
							style:--chip-color={item.color}
							aria-current={item.id === data.moodId ? 'true' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>

			<div class="controls">
				<div class="menus">
					<FilterMenu id="filter-length" label="Length" options={lengths} value={data.length} />
					<FilterMenu id="filter-era" label="Era" options={eras} value={data.era} />
					<ActiveFilters items={active} clearHref={href({ length: 'any', era: 'any' })} />
				</div>
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
</div>

<style>
	@property --mood {
		syntax: '<color>';
		inherits: true;
		initial-value: #d6ff3f;
	}

	.mood-page {
		position: relative;
		--badge-color: var(--mood);
		isolation: isolate;
		transition: --mood 700ms var(--ease);
	}

	/* The whole page takes on the colour of the mood. */
	.glow {
		position: absolute;
		z-index: -1;
		inset: calc(var(--header-height) * -1) 0 auto;
		height: 620px;
		background: radial-gradient(
			90% 100% at 50% 0%,
			color-mix(in srgb, var(--mood) 24%, transparent),
			transparent 70%
		);
		pointer-events: none;
	}

	.current {
		display: inline-block;
		padding-bottom: 0.1em;
		margin-bottom: -0.1em;
		overflow: clip;
		vertical-align: bottom;
	}

	.word {
		display: inline-block;
		color: var(--mood);
		animation: word-up 560ms var(--ease) both;
	}

	@keyframes word-up {
		from {
			opacity: 0;
			transform: translateY(70%);
		}
	}

	.moods {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 24px;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px 24px;
		margin-top: 16px;
	}

	.menus {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.results {
		margin-top: clamp(20px, 3vw, 32px);
		transition: opacity 200ms var(--ease);
	}

	.results.busy {
		opacity: 0.45;
	}
</style>
