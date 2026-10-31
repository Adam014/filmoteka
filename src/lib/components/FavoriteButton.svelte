<script>
	import { isFavorite, toggleFavorite } from '../state/favorites.svelte.js';
	import Icon from './Icon.svelte';

	let { media, variant = 'button' } = $props();
	let active = $derived(isFavorite(media));
	let label = $derived(active ? 'Remove from favorites' : 'Add to favorites');

	let popping = $state(false);

	function onclick(event) {
		event.preventDefault();
		event.stopPropagation();
		popping = true;
		toggleFavorite(media);
	}
</script>

{#if variant === 'overlay'}
	<button
		class="overlay"
		class:active
		class:popping
		onanimationend={() => (popping = false)}
		type="button"
		aria-label="{label}: {media.title}"
		aria-pressed={active}
		title={label}
		{onclick}
	>
		<Icon name="star" size={20} filled={active} />
	</button>
{:else}
	<button
		class="btn"
		class:active
		class:popping
		onanimationend={() => (popping = false)}
		type="button"
		aria-pressed={active}
		{onclick}
	>
		<Icon name="star" size={18} filled={active} />
		{active ? 'Saved' : 'Add to favorites'}
	</button>
{/if}

<style>
	.active :global(svg) {
		color: var(--accent);
	}

	.popping :global(svg) {
		animation: star-pop 520ms var(--spring);
	}

	@keyframes star-pop {
		0% {
			transform: scale(0.6) rotate(-24deg);
		}
		60% {
			transform: scale(1.25) rotate(8deg);
		}
		100% {
			transform: none;
		}
	}

	.overlay {
		position: absolute;
		top: 4px;
		right: 4px;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		color: #fff;
		filter: drop-shadow(0 1px 3px rgb(0 0 0 / 0.9));
		transition: opacity 160ms var(--ease);
	}

	.overlay:hover :global(svg) {
		color: var(--accent);
	}

	@media (hover: hover) {
		.overlay:not(.active) {
			opacity: 0;
		}

		:global(.media-card:hover) .overlay,
		.overlay:focus-visible {
			opacity: 1;
		}
	}
</style>
