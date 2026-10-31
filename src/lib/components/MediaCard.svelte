<script>
	import { tilt } from '../actions/motion.js';
	import { formatRating, yearOf } from '../format.js';
	import { imageUrl, mediaHref, posterSrcset } from '../media.js';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';

	let { media, favorite = true, eager = false } = $props();
	let failed = $state(false);
	let meta = $derived(
		[yearOf(media.date), media.type === 'tv' ? 'Series' : ''].filter(Boolean).join(' · ')
	);
	let rating = $derived(formatRating(media.rating));

	// Names this poster for the page transition, so it morphs into the one on the detail page.
	function markForTransition(event) {
		if (event.metaKey || event.ctrlKey || event.shiftKey) return;
		// Two elements can't share a name, so a detail page's own poster gives it up first.
		const own = /** @type {HTMLElement | null} */ (document.querySelector('[data-poster-morph]'));
		if (own) own.style.viewTransitionName = 'none';
		event.currentTarget.querySelector('.poster').style.viewTransitionName = 'poster-active';
	}
</script>

<article class="media-card">
	<a href={mediaHref(media)} class="poster-link" draggable="false" onclick={markForTransition}>
		<div class="poster" use:tilt>
			{#if media.poster_path && !failed}
				<img
					src={imageUrl(media.poster_path)}
					srcset={posterSrcset(media.poster_path)}
					sizes="(max-width: 600px) 45vw, 220px"
					alt=""
					width="342"
					height="513"
					loading={eager ? 'eager' : 'lazy'}
					decoding="async"
					onerror={() => (failed = true)}
				/>
			{:else}
				<span class="no-poster">{media.title}</span>
			{/if}
			{#if rating}
				<span class="badge">
					<Icon name="star" size={13} filled />
					<span class="visually-hidden">Rating</span>
					{rating}
				</span>
			{/if}
		</div>
		<h3 class="title">{media.title}</h3>
	</a>
	{#if meta}<p class="meta">{meta}</p>{/if}
	{#if favorite}
		<FavoriteButton {media} variant="overlay" />
	{/if}
</article>

<style>
	.media-card {
		position: relative;
		min-width: 0;
	}

	.poster-link {
		display: block;
	}

	.poster {
		aspect-ratio: 2 / 3;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: var(--surface);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		position: relative;
		transform: perspective(700px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition:
			transform 320ms var(--ease),
			box-shadow 320ms var(--ease);
	}

	.poster::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at var(--gx, 50%) var(--gy, 50%),
			rgb(255 255 255 / 0.22),
			transparent 58%
		);
		opacity: 0;
		pointer-events: none;
		transition: opacity 240ms var(--ease);
	}

	.poster-link:hover .poster {
		box-shadow: 0 18px 44px rgb(0 0 0 / 0.55);
		outline-color: var(--line-strong);
	}

	.badge {
		position: absolute;
		top: 8px;
		left: 8px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		background: rgb(8 9 11 / 0.72);
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.badge :global(svg) {
		color: var(--accent);
	}

	.poster-link:hover .poster::after {
		opacity: 1;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		-webkit-user-drag: none;
		user-select: none;
	}

	.no-poster {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 12px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		text-align: center;
	}

	.title {
		display: -webkit-box;
		margin-top: 10px;
		overflow: hidden;
		transition: color 160ms var(--ease);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	.poster-link:hover .title {
		color: var(--accent);
	}

	.meta {
		margin-top: 2px;
		color: var(--text-faint);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
</style>
