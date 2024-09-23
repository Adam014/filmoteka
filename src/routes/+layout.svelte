<script>
	import { inject } from '@vercel/analytics';
	import { Toaster } from 'svelte-french-toast';
	import Navbar from '../components/Navbar.svelte';
	import { page } from '$app/stores'; 

	if (process.env.NODE_ENV === 'production') {
		inject();
	}

	// Access the data returned from the server load function
	export let data;
	const { session } = data;
</script>

{#if !$page.url.pathname.startsWith('/register') && !$page.url.pathname.startsWith('/login')}
<Navbar {session} />
{/if}

<main>
	<Toaster position="bottom-right" />
	<slot />
</main>
