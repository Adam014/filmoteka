<script>
	import { user } from '../stores/user';
	import { onDestroy, onMount } from 'svelte';
	import { supabase } from '../lib/db/supabaseClient';
	import RootMovies from '../components/Root.svelte';
	import Users from '../components/Users.svelte';
	import TopActors from '../components/TopActors.svelte';
	import TopMovies from '../components/TopMovies.svelte';

	export let data;

	const movies = data?.movies;
	const detailed_movies = data?.detailed_movies;
	const actors = data?.actors;
	const users = data?.users.users;
	const topRatedMovies = data?.topRatedMovies;
	console.log(topRatedMovies);

	let currentUser = null;
	let username;

	// Variable for GitHub repository last updated date
	let repoUpdatedDate = 'Loading...';

	// Subscribe to the user store
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
		username = value?.identities?.[0]?.identity_data?.display_name;
	});

	onDestroy(() => {
		unsubscribe();
	});

	onMount(async () => {
		// Fetch the GitHub repository last updated date
		try {
			const res = await fetch('https://api.github.com/repos/Adam014/filmoteka');
			const repoData = await res.json();
			// Use the updated_at field; new Date(...).toLocaleString() converts to the browser's local timezone.
			repoUpdatedDate = repoData.updated_at
				? new Date(repoData.updated_at).toLocaleString()
				: 'N/A';
		} catch (err) {
			console.error('Error fetching GitHub repo data:', err);
			repoUpdatedDate = 'Error fetching date';
		}
	});
</script>

<svelte:head>
	<title>Filmoteka</title>
</svelte:head>

<div class="root-container">
	<div class="title-container">
		<h1>Welcome {username ? username : 'user'}!</h1>
		<h4>Last Updated: {repoUpdatedDate}</h4>
	</div>
	<div class="button-library">
		<div class="first-button">
			<a href="/games/daily">
				<button class="button2">
					<p class="button__text">
						<span style="--index: 0;">D</span>
						<span style="--index: 1;">A</span>
						<span style="--index: 2;">I</span>
						<span style="--index: 3;">L</span>
						<span style="--index: 4;">Y</span>
						<span style="--index: 6;">C</span>
						<span style="--index: 7;">H</span>
						<span style="--index: 8;">A</span>
						<span style="--index: 9;">L</span>
						<span style="--index: 10;">L</span>
						<span style="--index: 11;">E</span>
						<span style="--index: 12;">N</span>
						<span style="--index: 13;">G</span>
						<span style="--index: 14;">E</span>
					</p>

					<div class="button__circle">
						<svg
							viewBox="0 0 14 15"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="button__icon"
							width="14"
						>
							<path
								d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
								fill="currentColor"
							/>
						</svg>

						<svg
							viewBox="0 0 14 15"
							fill="none"
							width="14"
							xmlns="http://www.w3.org/2000/svg"
							class="button__icon button__icon--copy"
						>
							<path
								d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
								fill="currentColor"
							/>
						</svg>
					</div>
				</button>
			</a>
		</div>
	</div>

	<RootMovies {movies} {detailed_movies} />

	<TopActors {actors} />

	<TopMovies {topRatedMovies} />

	<Users {users} />
</div>

<style>
	a {
		text-decoration: none;
		color: white;
	}

	/* .root-container {
		padding: 80px;
	} */

	.title-container {
		padding: 20px 65px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	h1 {
		padding: 10px 0;
		font-size: 2rem;
		text-decoration: underline dotted;
	}

	.button-library {
		position: fixed;
		z-index: 99;
		bottom: 0;
		right: 0;
		padding: 30px;
	}

	.button2 {
		cursor: pointer;
		border: none;
		background: #7808d0;
		color: #fff;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		position: relative;
		display: grid;
		place-content: center;
		transition: background 300ms, transform 200ms;
		font-weight: 600;
	}

	.button__text {
		position: absolute;
		inset: 0;
		animation: text-rotation 8s linear infinite;
	}

	.button__text span {
		position: absolute;
		transform: rotate(calc(19deg * var(--index)));
		inset: 7px;
	}

	.button__circle {
		position: relative;
		width: 40px;
		height: 40px;
		overflow: hidden;
		background: #fff;
		color: #7808d0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.button__icon--copy {
		position: absolute;
		transform: translate(-150%, 150%);
	}

	.button2:hover {
		background: #000;
		transform: scale(1.05);
	}

	.button2:hover .button__icon {
		color: #000;
	}

	.button2:hover .button__icon:first-child {
		transition: transform 0.3s ease-in-out;
		transform: translate(150%, -150%);
	}

	.button2:hover .button__icon--copy {
		transition: transform 0.3s ease-in-out 0.1s;
		transform: translate(0);
	}

	@keyframes text-rotation {
		to {
			rotate: 360deg;
		}
	}

	@media (max-width: 600px) {
		.root-container {
			padding: 20px;
		}

		.cards-container {
			grid-template-columns: 1fr;
		}

		.button2 {
			width: 80px;
			height: 80px;
		}

		.button__text {
			font-size: 0.6rem;
		}
		.button-library {
			padding-top: 20px;
		}
	}

	@media (max-width: 700px) {
		.title-container {
			display: block;
			padding: 0;
			padding-bottom: 20px;
		}

		.root-container {
			padding: 0px 10px 0px 30px;
		}
	}
</style>
