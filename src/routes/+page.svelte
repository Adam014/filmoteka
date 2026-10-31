<script>
	import { goto } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import Countdown from '#lib/components/Countdown.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import FilterMenu from '#lib/components/FilterMenu.svelte';
	import GameTiles from '#lib/components/GameTiles.svelte';
	import LandingHero from '#lib/components/LandingHero.svelte';
	import Marquee from '#lib/components/Marquee.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import PersonCard from '#lib/components/PersonCard.svelte';
	import Row from '#lib/components/Row.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import SpotlightPanels from '#lib/components/SpotlightPanels.svelte';
	import { countryName } from '#lib/format.js';
	import { REGIONS } from '#lib/region.js';
	import { profileHref } from '#lib/user.js';

	let { data } = $props();

	let tab = $state('trending');

	let tabs = $derived(
		[
			{ id: 'trending', label: 'Trending', items: data.trending },
			{ id: 'cinemas', label: 'In cinemas', items: data.nowPlaying },
			{ id: 'movies', label: 'Top films', items: data.topMovies },
			{ id: 'series', label: 'Top series', items: data.topSeries },
			{ id: 'soon', label: 'Coming soon', items: data.upcoming }
		].filter((item) => item.items.length || item.id === 'cinemas')
	);
	let current = $derived(tabs.find((item) => item.id === tab) ?? tabs[0]);
	let regions = $derived(
		[...new Set([...REGIONS, data.region])]
			.map((code) => ({ id: code, label: countryName(code) }))
			.sort((a, b) => a.label.localeCompare(b.label))
	);
	let isEmpty = $derived(
		!data.featured.length &&
			!data.trending.length &&
			!data.topMovies.length &&
			!data.topSeries.length &&
			!data.actors.length
	);
	let wall = $derived(
		[
			...new Set(
				[...data.topMovies, ...data.trending, ...data.topSeries, ...data.nowPlaying]
					.map((item) => item.poster_path)
					.filter(Boolean)
			)
		].slice(0, 48)
	);

	function changeRegion(code) {
		goto(`/?region=${code}`, { reset: false });
	}
</script>

<svelte:head>
	<title>Filmoteka: what are we watching tonight?</title>
	<meta
		name="description"
		content="Find a film for tonight by mood or search, swipe through picks and play the daily film games."
	/>
</svelte:head>

{#if isEmpty}
	<div class="container">
		<EmptyState title="The catalogue is taking a break" heading="h1">
			<p>We can't reach our film data right now. Your favorites are safe, so check back shortly.</p>
			<a class="btn" href="/">Try again</a>
		</EmptyState>
	</div>
{:else}
	<LandingHero posters={wall} />

	{#if data.featured.length}
		<section class="section container reveal">
			<h2 class="section-title lead">Spotlight</h2>
			<SpotlightPanels movies={data.featured.slice(0, 6)} />
		</section>
	{/if}

	<Row
		title="Browse"
		head={tabsHead}
		action={current.id === 'cinemas' ? regionPicker : undefined}
		count={tabs.indexOf(current) * 1000 + current.items.length}
	>
		{#key current.id}
			{#each current.items as item, index (`${item.type}-${item.id}`)}
				<div class="rise" style:--i={Math.min(index, 10)}><MediaCard media={item} /></div>
			{:else}
				<p class="none">No current listings for {countryName(data.region)}.</p>
			{/each}
		{/key}
	</Row>

	{#snippet tabsHead()}
		<Segmented options={tabs} value={current.id} label="Browse" onselect={(id) => (tab = id)} />
	{/snippet}

	{#snippet regionPicker()}
		<FilterMenu
			id="filter-region"
			label="In"
			options={regions}
			value={data.region}
			onselect={changeRegion}
			neutral
		/>
	{/snippet}

	<section class="section container reveal">
		<div class="section-head">
			<h2 class="section-title">Play today</h2>
			<Countdown />
		</div>
		<GameTiles games={data.games} />
	</section>

	{#if data.trending.length}
		<section class="section container reveal">
			<div class="band">
				<div class="band-copy">
					<h2>Can't pick a film?</h2>
					<p>Swipe through ten. We'll tell you what to watch.</p>
					<a class="band-btn" href="/swipe">Start swiping</a>
				</div>
				<div class="band-wall" aria-hidden="true">
					<Marquee
						posters={data.topMovies.map((item) => item.poster_path).filter(Boolean)}
						speed={50}
					/>
				</div>
			</div>
		</section>
	{/if}

	{#if data.actors.length}
		<Row title="Popular actors" count={data.actors.length}>
			{#each data.actors as person (person.id)}
				<PersonCard {person} />
			{/each}
		</Row>
	{/if}

	{#if data.users.length}
		<section class="section container community reveal">
			<h2 class="section-title">Community</h2>
			<ul>
				{#each data.users as user (user.id)}
					<li>
						<a href={profileHref(user.name)}>
							<Avatar name={user.name} src={user.avatar} size={36} />
							<span>{user.name}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<style>
	.lead {
		margin-bottom: 20px;
	}

	.none {
		min-width: 60vw;
		color: var(--text-muted);
	}

	.band {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
		align-items: center;
		gap: 24px;
		overflow: hidden;
		background: var(--accent);
		border-radius: var(--radius-lg);
		color: var(--on-accent);
	}

	.band-copy {
		display: grid;
		justify-items: start;
		gap: 8px;
		padding: clamp(28px, 4vw, 56px);
	}

	.band h2 {
		font-size: clamp(2rem, 5vw, 4rem);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1;
	}

	.band p {
		font-size: 1.0625rem;
		font-weight: 500;
	}

	.band-btn {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		margin-top: 12px;
		padding: 0 24px;
		background: var(--on-accent);
		border-radius: 999px;
		color: var(--accent);
		font-weight: 600;
		transition: transform 320ms var(--spring);
	}

	.band-btn:hover {
		transform: scale(1.05);
	}

	.band-wall {
		min-width: 0;
		padding-block: 24px;
		transform: rotate(-4deg) scale(1.1);
	}

	.community ul {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		margin-top: 20px;
	}

	.community a {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		padding-right: 8px;
		color: var(--text-muted);
		transition: color 160ms var(--ease);
	}

	.community a:hover {
		color: var(--text);
	}

	@media (max-width: 767px) {
		.band {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}

		.band-copy {
			padding-bottom: 8px;
		}
	}
</style>
