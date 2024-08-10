<script>
	import { goto } from '$app/navigation';
	import { loadMovies } from '../utils/utils.js';

	// Function to navigate to the first page and load cached movies
	async function goToFirstPage(event) {
		event.preventDefault(); // Prevent default anchor behavior
		const movies = JSON.parse(localStorage.getItem('movies_page_1'));

		if (movies) {
			// Dispatch an event with the cached movies
			window.dispatchEvent(new CustomEvent('movies-loaded', { detail: { movies, page: 1 } }));
			goto('/?page=1', { replaceState: true });
		} else {
			await loadMovies(1); // If not cached, load them
			goto('/?page=1', { replaceState: true });
		}
	}
</script>

<nav>		
	<div class="navbar-container">
		<a href="/?page=1" on:click={goToFirstPage} on:keydown={(e) => e.key === 'Enter' && goToFirstPage(e)}>
			<h1>Filmoteka</h1>
		</a>
	</div>
</nav>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
	h1 {
		padding: 0 1rem;
		font-family: 'Shadows Into Light', cursive;
		font-size: 3rem;
		color: #e5e5e5;
	}
	.navbar-container {
		display: flex;
		justify-content: center;
	}
	a {
		text-decoration: none;
		color: black;
		text-align: center;
		cursor: pointer;
	}
</style>
