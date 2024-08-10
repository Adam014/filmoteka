<script>
    import Navbar from "../components/Navbar.svelte";
	import { inject } from '@vercel/analytics';

	if (process.env.NODE_ENV === 'production') {
		inject();
	}

</script>

<Navbar />

<main>
	<slot />
</main>