<script>
	import { formatRating, yearOf } from '../format.js';
	import { imageUrl, mediaHref } from '../media.js';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';

	let { movies } = $props();
	let active = $state(0);
	let intent;

	function hover(index) {
		clearTimeout(intent);
		intent = setTimeout(() => (active = index), 90);
	}
</script>

<ol class="panels">
	{#each movies as movie, index (movie.id)}
		{@const rating = formatRating(movie.rating)}
		<li
			class="panel-card"
			class:open={index === active}
			onpointerenter={(event) => event.pointerType === 'mouse' && hover(index)}
			onfocusin={() => (active = index)}
		>
			<img src={imageUrl(movie.backdrop_path, 'w1280')} alt="" loading="lazy" draggable="false" />
			<a class="cover" href={mediaHref(movie)} aria-label={movie.title} draggable="false"></a>
			<span class="side-title" aria-hidden="true">{movie.title}</span>
			<div class="content">
				<h3>{movie.title}</h3>
				<p class="meta">
					{#if yearOf(movie.date)}<span>{yearOf(movie.date)}</span>{/if}
					{#if rating}<span class="rating"><Icon name="star" size={15} filled />{rating}</span>{/if}
				</p>
				{#if movie.overview}<p class="overview">{movie.overview}</p>{/if}
				<div class="actions">
					<a class="btn btn-primary" href={mediaHref(movie)}>View film</a>
					<FavoriteButton media={movie} />
				</div>
			</div>
		</li>
	{/each}
</ol>

<style>
	.panels {
		display: flex;
		gap: 8px;
		height: clamp(380px, 62vh, 620px);
	}

	.panel-card {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		overflow: hidden;
		isolation: isolate;
		background: var(--surface);
		border-radius: var(--radius-lg);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		transition: flex-grow 620ms var(--ease);
	}

	.panel-card.open {
		flex-grow: 6;
	}

	img {
		position: absolute;
		z-index: -2;
		top: 0;
		left: 50%;
		width: auto;
		min-width: 100%;
		height: 100%;
		max-width: none;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		opacity: 0.45;
		transform: translateX(-50%);
		transition:
			opacity 500ms var(--ease),
			transform 900ms var(--ease);
		-webkit-user-drag: none;
	}

	.open img {
		opacity: 1;
	}

	.panel-card::after {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 0;
		background: linear-gradient(to top, rgb(8 9 11 / 0.82), rgb(8 9 11 / 0) 62%);
	}

	.cover {
		position: absolute;
		inset: 0;
	}

	.side-title {
		position: absolute;
		bottom: 20px;
		left: 50%;
		max-height: calc(100% - 40px);
		overflow: hidden;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
		transform: translateX(-50%) rotate(180deg);
		transition: opacity 240ms var(--ease);
		writing-mode: vertical-rl;
		pointer-events: none;
	}

	.open .side-title {
		opacity: 0;
	}

	.content {
		position: relative;
		align-self: flex-end;
		width: min(560px, 100%);
		min-width: 340px;
		padding: clamp(20px, 2.6vw, 36px);
		opacity: 0;
		transform: translateY(14px);
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 220ms var(--ease),
			transform 360ms var(--ease),
			visibility 220ms;
	}

	.open .content {
		opacity: 1;
		transform: none;
		visibility: visible;
		transition-delay: 200ms;
		pointer-events: none;
	}

	.open .actions {
		pointer-events: auto;
	}

	h3 {
		font-size: clamp(1.75rem, 3.4vw, 3rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.05;
	}

	.meta {
		display: flex;
		gap: 12px;
		margin-top: 8px;
		color: var(--text-muted);
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.rating :global(svg) {
		color: var(--accent);
	}

	.overview {
		display: -webkit-box;
		margin-top: 8px;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		color: rgb(246 247 248 / 0.84);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	/* Phones have no hover, so the panels become a row of full cards to swipe through. */
	@media (max-width: 900px) {
		.panels {
			height: auto;
			margin-inline: calc(var(--gutter) * -1);
			padding-inline: var(--gutter);
			overflow-x: auto;
			scroll-padding-inline: var(--gutter);
			scroll-snap-type: x mandatory;
			scrollbar-width: none;
		}

		.panels::-webkit-scrollbar {
			display: none;
		}

		.panel-card,
		.panel-card.open {
			flex: 0 0 min(84vw, 480px);
			height: clamp(380px, 62svh, 520px);
			scroll-snap-align: start;
		}

		img,
		.open img {
			opacity: 0.9;
		}

		.side-title {
			display: none;
		}

		.content,
		.open .content {
			min-width: 0;
			opacity: 1;
			transform: none;
			visibility: visible;
		}

		.actions {
			pointer-events: auto;
		}
	}
</style>
