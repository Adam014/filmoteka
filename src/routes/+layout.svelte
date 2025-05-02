<script>
	import { inject } from '@vercel/analytics';
	import { Toaster } from 'svelte-french-toast';
	import Navbar from '../components/Navbar.svelte';
	import { page } from '$app/stores';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	if (process.env.NODE_ENV === 'production') {
		inject();
		console.warn = () => {};
	}

	// Access the data returned from the server load function
	export let data;
	const { session } = data;

	const toastKey = 'trafficToastShown';

	onMount(() => {
		// Check if the toast has already been shown
		const isToastShown = localStorage.getItem(toastKey);

		if (!isToastShown) {
			// Show the toast
			toast(
				'🎮 A new game is available! Check it out in the menu or at filmoteka.app/games/daily 🚀',
				{
					duration: 15000,
					icon: '🎉'
				}
			);

			// Set a flag in localStorage to prevent showing again
			localStorage.setItem(toastKey, 'true');
		}
	});
</script>

{#if !$page.url.pathname.startsWith('/register') && !$page.url.pathname.startsWith('/login')}
	<Navbar {session} />
{/if}

<main class="app-content main-content">
	<Toaster position="bottom-right" />
	<slot />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow-x: hidden;
		--primary-color: #3a86ff;
		--secondary-color: #ff006e;
		--accent-color: #8338ec;
		--dark-bg: #121212;
		--darker-bg: #0a0a0a;
		--light-text: #f8f9fa;
		--gray-text: #adb5bd;
		--card-bg: #1e1e1e;
		--gradient-bg: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);

		background-color: var(--dark-bg);
		background-image: radial-gradient(
			circle at 20% 50%,
			rgba(51, 16, 117, 0.4) 0%,
			rgba(13, 13, 13, 0.95) 100%
		);
		background-attachment: fixed;
		color: var(--light-text);
	}

	:global(*) {
		box-sizing: border-box;
	}

	.main-content {
		min-height: 100vh;
		width: 100%;
	}

	/* Toast styling overrides */
	:global(.toaster) {
		--toastBackground: var(--darker-bg, #0a0a0a);
		--toastColor: var(--light-text, #f8f9fa);
		--toastBorder: 1px solid rgba(255, 255, 255, 0.1);
		--toastBarBackground: var(--secondary-color, #ff006e);
	}

	:global(.toaster .toast) {
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
	}
</style>
