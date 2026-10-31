<script>
	import { formatRating, yearOf } from '../format.js';
	import { imageUrl, mediaHref } from '../media.js';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';
	import { fade } from 'svelte/transition';

	let { movies } = $props();

	let selectedId = $state(null);
	let paused = $state(false);
	let autoplay = $state(false);

	let index = $derived(
		Math.max(
			movies.findIndex((item) => item.id === selectedId),
			0
		)
	);
	let movie = $derived(movies[index]);
	let rating = $derived(formatRating(movie.rating));
	let words = $derived(movie.title.split(' '));

	$effect(() => {
		autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
		const onvisibility = () => (paused = document.hidden);
		document.addEventListener('visibilitychange', onvisibility);
		return () => document.removeEventListener('visibilitychange', onvisibility);
	});

	// Loads the next backdrop ahead of time, so the cross-fade never reveals an empty frame.
	$effect(() => {
		const next = movies[(index + 1) % movies.length];
		new Image().src = imageUrl(next.backdrop_path, 'w1280');
	});

	function advance() {
		selectedId = movies[(index + 1) % movies.length].id;
	}
</script>

<section
	class="hero"
	aria-label="Featured movies"
	onpointerenter={() => (paused = true)}
	onpointerleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<div class="stage">
		<div class="parallax">
			{#key movie.id}
				<img
					class="art"
					src={imageUrl(movie.backdrop_path, 'w1280')}
					srcset="{imageUrl(movie.backdrop_path, 'w780')} 780w, {imageUrl(
						movie.backdrop_path,
						'w1280'
					)} 1280w, {imageUrl(movie.backdrop_path, 'original')} 2560w"
					sizes="100vw"
					alt=""
					fetchpriority="high"
					transition:fade={{ duration: 800 }}
				/>
			{/key}
		</div>

		<div class="container copy">
			{#key movie.id}
				<h1 aria-label={movie.title}>
					{#each words as word, position (`${word}-${position}`)}
						<span class="word" aria-hidden="true">
							<span style:--i={position}>{word}</span>
						</span>
					{/each}
				</h1>
				<p class="meta rise" style:--i={words.length}>
					{#if yearOf(movie.date)}<span>{yearOf(movie.date)}</span>{/if}
					{#if rating}
						<span class="rating"><Icon name="star" size={15} filled />{rating}</span>
					{/if}
				</p>
				{#if movie.overview}
					<p class="overview rise" style:--i={words.length + 1}>{movie.overview}</p>
				{/if}
			{/key}
			<div class="actions">
				<a class="btn btn-primary" href={mediaHref(movie)}>View details</a>
				<FavoriteButton media={movie} />
			</div>
		</div>
	</div>

	{#if movies.length > 1}
		<div class="thumbs-wrap">
			<ul class="thumbs" aria-label="Choose a featured movie">
				{#each movies as item (item.id)}
					<li>
						<button
							type="button"
							class:active={item.id === movie.id}
							aria-pressed={item.id === movie.id}
							onclick={() => (selectedId = item.id)}
						>
							<span class="thumb">
								<img src={imageUrl(item.backdrop_path, 'w300')} alt="" loading="lazy" />
								{#if autoplay && item.id === movie.id}
									<span class="progress" class:paused onanimationend={advance} aria-hidden="true"
									></span>
								{/if}
							</span>
							<span class="name">{item.title}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

<style>
	.stage {
		position: relative;
		display: flex;
		align-items: flex-end;
		min-height: min(72vh, 720px);
		overflow: hidden;
		isolation: isolate;
	}

	.parallax {
		position: absolute;
		z-index: -2;
		inset: 0;
	}

	.art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 20%;
		animation: drift 14s var(--ease) both;
	}

	@keyframes drift {
		from {
			transform: scale(1.08);
		}
	}

	@supports (animation-timeline: scroll()) {
		@media (prefers-reduced-motion: no-preference) {
			.parallax {
				animation: hero-parallax linear both;
				animation-timeline: scroll(root);
				animation-range: 0 720px;
			}
		}
	}

	@keyframes hero-parallax {
		to {
			transform: translateY(16%);
			opacity: 0.35;
		}
	}

	.stage::after {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 0;
		background:
			linear-gradient(to top, var(--bg) 0%, rgb(10 10 11 / 0.55) 42%, rgb(10 10 11 / 0) 72%),
			linear-gradient(to right, rgb(10 10 11 / 0.72) 0%, rgb(10 10 11 / 0) 62%);
	}

	.copy {
		padding-block: clamp(120px, 22vh, 220px) clamp(24px, 3vw, 40px);
	}

	h1 {
		max-width: 16ch;
		font-size: clamp(2.5rem, 7vw, 5.75rem);
		font-weight: 600;
		letter-spacing: -0.045em;
		line-height: 1;
		text-wrap: wrap;
	}

	/* Each word slides up from behind its own line. */
	.word {
		display: inline-block;
		margin-right: 0.22em;
		overflow: clip;
		overflow-clip-margin: 0.08em;
		padding-bottom: 0.1em;
		margin-bottom: -0.1em;
		vertical-align: top;
	}

	.word > span {
		display: inline-block;
		animation: word-in 820ms var(--ease) both;
		animation-delay: calc(var(--i) * 60ms);
	}

	@keyframes word-in {
		from {
			transform: translateY(110%);
		}
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 16px;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.overview {
		display: -webkit-box;
		margin-top: 12px;
		max-width: 62ch;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		color: rgb(245 245 246 / 0.82);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}

	.thumbs-wrap {
		max-width: var(--content-max);
		margin-inline: auto;
	}

	.thumbs {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: clamp(136px, 15vw, 196px);
		gap: 12px;
		padding: 4px var(--gutter);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.thumbs::-webkit-scrollbar {
		display: none;
	}

	.thumbs button {
		display: block;
		width: 100%;
		color: var(--text-faint);
		font-size: 0.875rem;
		text-align: left;
		transition:
			color 160ms var(--ease),
			transform 320ms var(--spring);
	}

	.thumbs button:hover {
		transform: translateY(-3px);
	}

	.thumbs button:hover,
	.thumbs button.active {
		color: var(--text);
	}

	.thumb {
		position: relative;
		display: block;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.55;
		transition: opacity 260ms var(--ease);
	}

	.thumbs button:hover img,
	.thumbs .active img {
		opacity: 1;
	}

	.progress {
		position: absolute;
		inset: auto 0 0;
		height: 3px;
		background: var(--text);
		transform-origin: left;
		animation: fill 8s linear both;
	}

	.progress.paused {
		animation-play-state: paused;
	}

	@keyframes fill {
		from {
			transform: scaleX(0);
		}
	}

	.name {
		display: block;
		margin-top: 8px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
