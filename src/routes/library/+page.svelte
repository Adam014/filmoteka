<script>
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/state';
	import { dragScroll } from '#lib/actions/motion.js';
	import ActiveFilters from '#lib/components/ActiveFilters.svelte';
	import CountUp from '#lib/components/CountUp.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FilterMenu from '#lib/components/FilterMenu.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import { GENRES } from '#lib/genres.js';
	import {
		DECADES,
		RATINGS,
		SORTS,
		filterHref,
		filterParams,
		toggleGenre
	} from '#lib/library-filters.js';

	let { data } = $props();

	let filters = $derived(data.filters);
	let busy = $derived(navigating.to?.route.id === '/library');
	let bar = $state();

	let sorts = $derived(
		SORTS.map((item) => ({ ...item, href: filterHref(filters, { sort: item.id }) }))
	);
	let decades = $derived(
		DECADES.map((item) => ({ ...item, href: filterHref(filters, { decade: item.id }) }))
	);
	let ratings = $derived(
		RATINGS.map((item) => ({ ...item, href: filterHref(filters, { rating: item.id }) }))
	);
	let active = $derived([
		...filters.genres.map((id) => ({
			key: `genre-${id}`,
			label: GENRES.find((genre) => genre.id === id)?.name,
			href: filterHref(filters, { genres: toggleGenre(filters, id) })
		})),
		...(filters.decade === 'any'
			? []
			: [
					{
						key: 'decade',
						label: DECADES.find((item) => item.id === filters.decade)?.label,
						href: filterHref(filters, { decade: 'any' })
					}
				]),
		...(filters.rating === 'any'
			? []
			: [
					{
						key: 'rating',
						label: `Rated ${RATINGS.find((item) => item.id === filters.rating)?.label}`,
						href: filterHref(filters, { rating: 'any' })
					}
				])
	]);

	// Changing a filter from far down the page goes back to the top of the new results.
	afterNavigate(({ from, to }) => {
		if (!bar || from?.route.id !== to?.route.id) return;
		const top = bar.parentElement.getBoundingClientRect().top + scrollY - 80;
		if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
	});
</script>

<svelte:head>
	<title>{data.page > 1 ? `Library, page ${data.page}` : 'Library'} | Filmoteka</title>
	<meta name="description" content="Browse every film by genre, decade and rating." />
</svelte:head>

<div class="container page">
	<div class="head">
		<h1 class="page-title">Library</h1>
		{#if !data.failed}
			<p class="count"><CountUp value={data.count} duration={600} /> films</p>
		{/if}
	</div>

	<div class="filters-area">
		<div class="filters" bind:this={bar} data-sveltekit-reset="false">
			<ul class="genres" use:dragScroll aria-label="Genre">
				{#each GENRES as genre (genre.id)}
					{@const on = filters.genres.includes(genre.id)}
					<li>
						<a
							class="chip"
							href={filterHref(filters, { genres: toggleGenre(filters, genre.id) })}
							aria-current={on ? 'true' : undefined}
							draggable="false"
						>
							{genre.name}
						</a>
					</li>
				{/each}
			</ul>
			<div class="controls">
				<Segmented options={sorts} value={filters.sort} label="Sort by" />
				<div class="menus">
					<FilterMenu id="filter-decade" label="Decade" options={decades} value={filters.decade} />
					<FilterMenu id="filter-rating" label="Rating" options={ratings} value={filters.rating} />
				</div>
			</div>
		</div>
		<div class="applied" data-sveltekit-reset="false">
			<ActiveFilters
				items={active}
				clearHref={filterHref({ ...filters, genres: [], decade: 'any', rating: 'any' })}
			/>
		</div>

		{#if data.failed}
			<EmptyState title="The library didn't load">
				<p>We couldn't reach the catalogue. This is usually over quickly.</p>
				<a class="btn" href="/library" data-sveltekit-reload>Try again</a>
			</EmptyState>
		{:else if !data.movies.length}
			<EmptyState title="Nothing fits all of that">
				<p>Take a filter off and there'll be more to choose from.</p>
				<a class="btn" href="/library">Clear filters</a>
			</EmptyState>
		{:else}
			{#key `${filters.sort}-${filters.genres}-${filters.decade}-${filters.rating}-${data.page}`}
				<div class="media-grid grid rise" class:busy>
					{#each data.movies as media, index (media.id)}
						<MediaCard {media} eager={index < 12} />
					{/each}
				</div>
			{/key}
			<Pagination current={data.page} total={data.totalPages} params={filterParams(filters)} />
		{/if}
	</div>
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 16px;
	}

	.count {
		color: var(--text-muted);
		font-size: 1.0625rem;
	}

	.filters-area {
		margin-top: 16px;
	}

	.filters {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
		margin-inline: calc(var(--gutter) * -0.25);
		padding: 10px;
		background: rgb(14 15 18 / 0.9);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(18px) saturate(1.4);
		-webkit-backdrop-filter: blur(18px) saturate(1.4);
	}

	.genres {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
	}

	.genres::-webkit-scrollbar {
		display: none;
	}

	.genres li:last-child {
		padding-right: 32px;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.menus {
		display: flex;
		gap: 6px;
	}

	.applied {
		margin-top: 10px;
	}

	.grid {
		margin-top: clamp(16px, 3vw, 28px);
		transition: opacity 180ms var(--ease);
	}

	.grid.busy {
		opacity: 0.4;
	}

	@media (min-width: 768px) {
		.filters {
			position: sticky;
			z-index: 20;
			top: var(--sticky-top);
			transition: top 360ms var(--ease);
		}
	}
</style>
