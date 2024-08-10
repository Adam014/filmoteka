<script>
	import Navbar from '../components/Navbar.svelte';
	import { inject } from '@vercel/analytics';
	import { Toaster } from 'svelte-french-toast';

	if (process.env.NODE_ENV === 'production') {
		inject();
	}
</script>

<Navbar />

<main>
	<Toaster position="bottom-right" />
	<slot />
</main>
