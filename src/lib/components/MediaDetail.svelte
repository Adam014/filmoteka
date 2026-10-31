<script>
	import { formatRating, plural } from '../format.js';
	import { imageUrl, posterSrcset } from '../media.js';
	import Dialog from './Dialog.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';
	import PersonCard from './PersonCard.svelte';
	import Row from './Row.svelte';

	let { item } = $props();

	let trailerOpen = $state(false);
	let rating = $derived(formatRating(item.rating));
	let favoriteMedia = $derived({
		id: item.id,
		type: item.type,
		title: item.title,
		poster_path: item.poster_path,
		backdrop_path: item.backdrop_path,
		date: item.date,
		rating: item.rating,
		popularity: item.popularity,
		overview: item.overview,
		language: ''
	});
</script>

<svelte:head>
	<title>{item.title}{item.year ? ` (${item.year})` : ''} | Filmoteka</title>
	{#if item.overview}
		<meta name="description" content={item.overview.slice(0, 160)} />
	{/if}
</svelte:head>

<article class="detail">
	{#if item.backdrop_path}
		<div class="ambient" aria-hidden="true">
			<img src={imageUrl(item.backdrop_path, 'w300')} alt="" />
		</div>
	{/if}
	<div class="backdrop">
		{#if item.backdrop_path}
			<img
				src={imageUrl(item.backdrop_path, 'w1280')}
				srcset="{imageUrl(item.backdrop_path, 'w780')} 780w, {imageUrl(
					item.backdrop_path,
					'w1280'
				)} 1280w"
				sizes="100vw"
				alt=""
				fetchpriority="high"
			/>
		{/if}
	</div>

	<div class="container head" class:flush={!item.backdrop_path}>
		<div class="poster" data-poster-morph>
			{#if item.poster_path}
				<img
					src={imageUrl(item.poster_path, 'w342')}
					srcset={posterSrcset(item.poster_path)}
					sizes="(max-width: 767px) 120px, 280px"
					alt="Poster of {item.title}"
					width="342"
					height="513"
				/>
			{:else}
				<span>{item.title}</span>
			{/if}
		</div>

		<div class="summary">
			<h1 class="rise">{item.title}</h1>
			{#if item.originalTitle && item.originalTitle !== item.title}
				<p class="original">{item.originalTitle}</p>
			{/if}

			<ul class="meta rise" style:--i="1">
				{#if item.type === 'tv'}<li>Series</li>{/if}
				{#if item.year}<li>{item.year}</li>{/if}
				{#if item.runtime}<li>{item.runtime}</li>{/if}
				{#if item.genres.length}<li>{item.genres.join(', ')}</li>{/if}
				{#if rating}
					<li class="rating">
						<Icon name="star" size={15} filled />
						<span>{rating}<span class="visually-hidden"> out of 10</span></span>
					</li>
				{/if}
				{#if item.adult}<li class="adult">18+</li>{/if}
			</ul>

			<div class="actions rise" style:--i="2">
				{#if item.trailer}
					<button class="btn btn-primary" type="button" onclick={() => (trailerOpen = true)}>
						<Icon name="play" size={16} filled />
						Watch trailer
					</button>
				{/if}
				<FavoriteButton media={favoriteMedia} />
			</div>

			{#if item.tagline}
				<p class="tagline rise" style:--i="3">{item.tagline}</p>
			{/if}
			<p class="overview rise" style:--i="3">{item.overview || 'No overview available yet.'}</p>

			{#if item.creators.length}
				<p class="creators rise" style:--i="4">
					<span>{item.creatorLabel}</span>
					{#each item.creators as person, index (person.id)}
						<a class="link" href="/person/{person.id}">{person.name}</a>{index <
						item.creators.length - 1
							? ', '
							: ''}
					{/each}
				</p>
			{/if}
		</div>
	</div>

	{#if item.cast.length}
		<Row title="Cast" count={item.cast.length}>
			{#each item.cast as person (person.id)}
				<PersonCard {person} />
			{/each}
		</Row>
	{/if}

	<div class="container lower">
		{#if item.seasons.length}
			<section class="section">
				<h2 class="section-title">Seasons</h2>
				<ul class="seasons">
					{#each item.seasons as season (season.id)}
						<li>
							<span class="season-name">{season.name}</span>
							<span class="season-meta">
								{[season.year, plural(season.episodes, 'episode')].filter(Boolean).join(' · ')}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="section">
			<h2 class="section-title">Details</h2>
			<dl class="facts">
				{#each item.facts as fact (fact.label)}
					<div>
						<dt>{fact.label}</dt>
						<dd>
							{#if fact.href}
								<a class="link" href={fact.href} target="_blank" rel="noopener noreferrer">
									{fact.value}
								</a>
							{:else}
								{fact.value}
							{/if}
						</dd>
					</div>
				{/each}
				{#if item.companies.length}
					<div>
						<dt>Production</dt>
						<dd>{item.companies.join(', ')}</dd>
					</div>
				{/if}
				{#if item.countries.length}
					<div>
						<dt>{item.countries.length > 1 ? 'Countries' : 'Country'}</dt>
						<dd>{item.countries.join(', ')}</dd>
					</div>
				{/if}
			</dl>
		</section>
	</div>
</article>

{#if item.trailer}
	<Dialog bind:open={trailerOpen} title={item.trailer.name} wide>
		<div class="player">
			<iframe
				src="https://www.youtube-nocookie.com/embed/{item.trailer.key}?autoplay=1&rel=0"
				title="Trailer for {item.title}"
				allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
			></iframe>
		</div>
	</Dialog>
{/if}

<style>
	/* The picture runs right up behind the floating header. */
	.detail {
		position: relative;
		margin-top: calc(var(--header-height) * -1);
		isolation: isolate;
	}

	/* The film's own colours wash softly over the top of the page. */
	.ambient {
		position: absolute;
		z-index: -1;
		inset: 0 0 auto;
		height: 1100px;
		overflow: hidden;
		pointer-events: none;
		mask-image: linear-gradient(to bottom, #000 30%, transparent);
	}

	.ambient img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(80px) saturate(1.6);
		opacity: 0.32;
		transform: scale(1.2);
	}

	.backdrop {
		position: relative;
		height: calc(clamp(200px, 42vw, 520px) + var(--header-height));
		overflow: hidden;
		mask-image: linear-gradient(to bottom, #000 55%, transparent);
	}

	.backdrop img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 20%;
		animation: backdrop-in 900ms var(--ease) both;
	}

	@keyframes backdrop-in {
		from {
			opacity: 0;
			transform: scale(1.05);
		}
	}

	@supports (animation-timeline: scroll()) {
		@media (prefers-reduced-motion: no-preference) {
			.backdrop img {
				animation: parallax linear both;
				animation-timeline: scroll(root);
				animation-range: 0 600px;
			}
		}
	}

	@keyframes parallax {
		to {
			transform: translateY(18%) scale(1.06);
		}
	}

	.backdrop::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgb(8 9 11 / 0.7), rgb(8 9 11 / 0.05) 70%);
	}

	.head {
		position: relative;
		display: grid;
		grid-template-columns: clamp(180px, 20vw, 280px) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 56px);
		margin-top: clamp(-180px, -12vw, -80px);
	}

	.head.flush {
		margin-top: 0;
		padding-top: calc(var(--header-height) + 40px);
	}

	.poster {
		view-transition-name: poster-active;
		display: grid;
		place-items: center;
		aspect-ratio: 2 / 3;
		align-self: start;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: var(--surface);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		color: var(--text-muted);
		text-align: center;
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
	}

	.poster img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.summary {
		align-self: end;
		min-width: 0;
		max-width: 76ch;
	}

	h1 {
		font-size: clamp(2.25rem, 5.5vw, 4.5rem);
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.original {
		margin-top: 8px;
		color: var(--text-faint);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		margin-top: 14px;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.adult {
		color: var(--danger);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}

	.tagline {
		margin-top: 26px;
		color: var(--text-muted);
		font-size: 1.125rem;
	}

	.overview {
		margin-top: 10px;
		font-size: 1.0625rem;
		line-height: 1.6;
	}

	.tagline + .overview {
		margin-top: 8px;
	}

	.actions + .overview {
		margin-top: 26px;
	}

	.creators {
		margin-top: 18px;
	}

	.creators > span {
		margin-right: 6px;
		color: var(--text-faint);
	}

	.lower {
		padding-bottom: clamp(56px, 8vw, 96px);
	}

	.seasons {
		margin-top: 12px;
		max-width: 720px;
	}

	.seasons li {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	.season-meta {
		flex: none;
		color: var(--text-faint);
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}

	.facts {
		margin-top: 12px;
		max-width: 720px;
	}

	.facts > div {
		display: grid;
		grid-template-columns: minmax(96px, 160px) minmax(0, 1fr);
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--text-faint);
	}

	.player {
		aspect-ratio: 16 / 9;
		background: #000;
	}

	.player iframe {
		width: 100%;
		height: 100%;
		border: 0;
	}

	@media (max-width: 767px) {
		.head {
			grid-template-columns: 112px minmax(0, 1fr);
			gap: 16px;
			margin-top: -72px;
		}

		.summary {
			display: contents;
		}

		h1 {
			grid-column: 2;
			align-self: end;
			font-size: clamp(1.625rem, 7vw, 2.25rem);
		}

		.poster {
			grid-row: 1 / span 2;
		}

		.original,
		.meta,
		.actions,
		.tagline,
		.overview,
		.creators {
			grid-column: 1 / -1;
			margin-top: 0;
		}
	}
</style>
