<script>
	import { inject } from '@vercel/analytics';
	import { Toaster } from 'svelte-french-toast';
	import Navbar from '../components/Navbar.svelte';
	import { page } from '$app/stores';
	import toast from 'svelte-french-toast';
	import { onMount } from 'svelte';

	toast.err

	if (process.env.NODE_ENV === 'production') {
		inject();
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
				"We’re experiencing higher-than-usual traffic! 🚀 Some features might be slower or temporarily unavailable. Thank you for your patience as we work to get everything running smoothly. 🙏",
				{
					duration: 10000
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

<main class="main-content">
	<Toaster position="bottom-right" />
	<slot />
</main>

<style>
	@media (max-width: 768px) {
		.main-content{
			padding-top: 60px;
		}
	}

</style>
