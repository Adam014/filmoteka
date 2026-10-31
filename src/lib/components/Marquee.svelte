<script>
	import { imageUrl } from '../media.js';

	let { posters, speed = 60, label = undefined } = $props();
</script>

<div
	class="marquee"
	style:--duration="{speed}s"
	aria-label={label}
	role={label ? 'img' : undefined}
>
	{#each [0, 1] as copy (copy)}
		<div class="track" aria-hidden="true">
			{#each posters as path (`${copy}-${path}`)}
				<img src={imageUrl(path, 'w185')} alt="" width="185" height="278" loading="lazy" />
			{/each}
		</div>
	{/each}
</div>

<style>
	.marquee {
		display: flex;
		overflow: hidden;
		mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
	}

	.track {
		display: flex;
		flex: none;
		gap: 12px;
		padding-right: 12px;
		animation: slide var(--duration) linear infinite;
	}

	.marquee:hover .track {
		animation-play-state: paused;
	}

	img {
		flex: none;
		width: clamp(92px, 11vw, 148px);
		height: auto;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	@keyframes slide {
		to {
			transform: translateX(-100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.track {
			animation: none;
		}
	}
</style>
