<script>
	import '@fontsource-variable/geist';
	import '../app.css';
	import { dev } from '$app/env';
	import { onNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';
	import SearchPalette from '#lib/components/SearchPalette.svelte';
	import Toaster from '#lib/components/Toaster.svelte';
	import { auth, initAuth } from '#lib/state/auth.svelte.js';
	import { syncFavorites } from '#lib/state/favorites.svelte.js';
	import { syncNotifications } from '#lib/state/notifications.svelte.js';
	import { palette } from '#lib/state/palette.svelte.js';
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Games fill exactly one screen, so nothing sits below them.
	const FULL_SCREEN = new Set([
		'/games/frames',
		'/games/connections',
		'/games/higher-lower',
		'/games/soundtrack',
		'/games/earworm',
		'/games/playlist',
		'/games/playlist/[source]/[id]',
		'/games/filmle',
		'/games/grid',
		'/games/year',
		'/games/emoji',
		'/games/daily/day-[day]',
		'/swipe'
	]);
	let fullScreen = $derived(FULL_SCREEN.has(page.route.id));

	onMount(() => {
		if (!dev && !['localhost', '127.0.0.1'].includes(location.hostname)) inject();
		return initAuth();
	});

	// Cross-fades between pages. Filters and pagination on the same page stay instant.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (navigation.from?.route.id === navigation.to?.route.id) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	$effect(() => {
		if (!auth.ready) return;
		syncFavorites();
		syncNotifications(auth.user);
	});

	function onkeydown(event) {
		const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
		const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
		if (combo || (event.key === '/' && !typing && !palette.open)) {
			event.preventDefault();
			palette.open = combo ? !palette.open : true;
		}
	}
</script>

<svelte:window {onkeydown} />

{#if navigating.to}
	<div class="progress" role="progressbar" aria-label="Loading page"></div>
{/if}

<div class="shell" class:full-screen={fullScreen}>
	<Header onsearch={() => (palette.open = true)} />
	<main id="content">
		{@render children()}
	</main>
	{#if !fullScreen}<Footer />{/if}
</div>

<SearchPalette bind:open={palette.open} />
<Toaster />

<style>
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		flex: 1;
		min-width: 0;
	}

	.full-screen {
		height: max(100dvh, 540px);
	}

	.full-screen main {
		display: flex;
		min-height: 0;
	}

	/* Phones give the whole screen to the game, which has its own way back. */
	@media (max-width: 767px), (max-height: 500px) {
		.full-screen :global(header) {
			display: none;
		}
	}

	.progress {
		position: fixed;
		z-index: 80;
		top: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: var(--accent);
		transform-origin: left;
		animation: progress 1.4s var(--ease) forwards;
	}

	@keyframes progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(0.9);
		}
	}
</style>
