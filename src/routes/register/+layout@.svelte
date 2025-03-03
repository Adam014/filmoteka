<script>
	import { Toaster } from 'svelte-french-toast';
	import film_wall from '../../lib/assets/film_wall.jpg';

	// Access the data returned from the server load function
	export let data;
	const { session } = data;
</script>

<main>
	<Toaster position="bottom-right" />
	<div class="form-container">
		<img src={film_wall} alt="film_wall" />
		<div class="form-overlay">
			<slot />
		</div>
	</div>
</main>

<style>
	.form-container {
		display: flex;
		width: 100%;
	}

	img {
		width: 60%;
		height: auto;
		object-fit: cover;
		position: relative;
	}

	.form-overlay {
		width: 40%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media (max-width: 1024px) {
		img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
			z-index: -1;
		}

		.form-overlay {
			width: 100%;
			backdrop-filter: blur(3px);
			border-radius: 8px;
		}
	}
</style>
