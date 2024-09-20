<script>
	import { inject } from '@vercel/analytics';
	import { Toaster } from 'svelte-french-toast';
	import Navbar from '../components/Navbar.svelte';

	if (process.env.NODE_ENV === 'production') {
		inject();
	}

	// Access the data returned from the server load function
	export let data;
	const { session } = data;
</script>

<Navbar {session} />

<main>
	<Toaster position="bottom-right" />
	<slot />
</main>
