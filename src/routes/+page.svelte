<script>
	import { goto } from '$app/navigation';
	import Avatar from '#lib/components/Avatar.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameTiles from '#lib/components/GameTiles.svelte';
	import Hero from '#lib/components/Hero.svelte';
	import Marquee from '#lib/components/Marquee.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import PersonCard from '#lib/components/PersonCard.svelte';
	import Row from '#lib/components/Row.svelte';
	import { countryName } from '#lib/format.js';
	import { MOODS } from '#lib/moods.js';
	import { REGIONS } from '#lib/region.js';
	import { profileHref } from '#lib/user.js';

	let { data } = $props();

	let country = $derived(countryName(data.region));
	let regions = $derived(
		[...new Set([...REGIONS, data.region])]
			.map((code) => ({ code, name: countryName(code) }))
			.sort((a, b) => a.name.localeCompare(b.name))
	);
	let isEmpty = $derived(
		!data.featured.length &&
			!data.trending.length &&
			!data.topMovies.length &&
			!data.topSeries.length &&
			!data.actors.length
	);

	function changeRegion(event) {
		goto(`/?region=${event.currentTarget.value}`, { reset: false });
	}
</script>

<svelte:head>
	<title>Filmoteka: movies, series and the people behind them</title>
	<meta
		name="description"
		content="Discover movies and series, follow what people love, and guess the daily film."
	/>
</svelte:head>

{#if isEmpty}
	<div class="container">
		<EmptyState title="The catalogue is taking a break">
			<p>We can't reach our film data right now. Your favorites are safe, so check back shortly.</p>
			<a class="btn" href="/">Try again</a>
		</EmptyState>
	</div>
{:else}
	{#if data.featured.length}
		<Hero movies={data.featured} />
	{/if}

	<section class="section container">
		<h2 class="section-title">What are you in the mood for?</h2>
		<ul class="moods">
			{#each MOODS as mood (mood.id)}
				<li><a class="chip" href="/mood?mood={mood.id}">{mood.label}</a></li>
			{/each}
		</ul>
	</section>

	{#snippet media(items)}
		{#each items as item (`${item.type}-${item.id}`)}
			<MediaCard media={item} />
		{/each}
	{/snippet}

	{#if data.trending.length}
		<Row title="Trending this week" count={data.trending.length}>
			{@render media(data.trending)}
		</Row>
	{/if}

	<section class="section container">
		<div class="section-head">
			<h2 class="section-title">Play today</h2>
			<a class="link" href="/games">All games</a>
		</div>
		<GameTiles games={data.games} />
	</section>

	{#snippet regionPicker()}
		<label class="visually-hidden" for="region">Country</label>
		<select id="region" class="select" value={data.region} onchange={changeRegion}>
			{#each regions as option (option.code)}
				<option value={option.code}>{option.name}</option>
			{/each}
		</select>
	{/snippet}

	<Row title="In cinemas in {country}" action={regionPicker} count={data.nowPlaying.length}>
		{#if data.nowPlaying.length}
			{@render media(data.nowPlaying)}
		{:else}
			<p class="none">No current listings for {country}.</p>
		{/if}
	</Row>

	{#if data.topSeries.length}
		<Row title="Top rated series" count={data.topSeries.length}>
			{@render media(data.topSeries)}
		</Row>
	{/if}

	{#if data.actors.length}
		<Row title="Popular actors" count={data.actors.length}>
			{#each data.actors as person (person.id)}
				<PersonCard {person} />
			{/each}
		</Row>
	{/if}

	{#if data.trending.length}
		<section class="section swipe">
			<div class="container swipe-copy">
				<div>
					<h2 class="section-title">Can't pick a film?</h2>
					<p>Swipe through posters until something grabs you.</p>
				</div>
				<a class="btn btn-primary" href="/swipe">Start swiping</a>
			</div>
			<Marquee posters={data.trending.map((item) => item.poster_path).filter(Boolean)} />
		</section>
	{/if}

	{#if data.topMovies.length}
		<Row title="Top rated movies" count={data.topMovies.length}>
			{@render media(data.topMovies)}
		</Row>
	{/if}

	{#if data.upcoming.length}
		<Row title="Coming soon in {country}" count={data.upcoming.length}>
			{@render media(data.upcoming)}
		</Row>
	{/if}

	{#if data.users.length}
		<section class="section container community">
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

	<div class="end"></div>
{/if}

<style>
	.moods {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}

	.swipe-copy {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px 32px;
		margin-bottom: 24px;
	}

	.swipe-copy p {
		margin-top: 6px;
		color: var(--text-muted);
	}

	.none {
		grid-column: 1 / -1;
		min-width: 60vw;
		color: var(--text-muted);
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

	.end {
		height: clamp(56px, 8vw, 96px);
	}
</style>
