<script>
	import { goto } from '$app/navigation';
	import { loadMovies } from '../lib/utils';
	import { supabase } from '../lib/db/supabaseClient.js';
	import { onDestroy, onMount } from 'svelte';
	import { user } from '../stores/user.js';
	import logo from '../lib/assets/Filmoteka_logo.svg';
	import Search from './Search.svelte';

	let currentUser;
	let menuOpen = false;

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
		const hamburger = document.querySelector('.hamburger input');
		if (hamburger) {
			hamburger.checked = false;
		}
	}

	// Close menu when clicking outside
	function closeMenuOnOutsideClick(event) {
		const hamburger = document.querySelector('.hamburger input');
		if (menuOpen && !event.target.closest('.nav-menu') && !event.target.closest('.hamburger')) {
			menuOpen = false;
			if (hamburger) {
				hamburger.checked = false;
			}
		}
	}

	async function signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			alert('Error signing out: ' + error.message);
		} else {
			goto('/');
			menuOpen = false;
		}
	}

	onMount(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', closeMenuOnOutsideClick);
		}

		return () => unsubscribe();
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('click', closeMenuOnOutsideClick);
		}
	});
</script>

<nav class="navbar-container {currentUser ? 'logged-in' : 'logged-out'}">
	<label class="hamburger">
		<input type="checkbox" on:click={toggleMenu} />
		<svg viewBox="0 0 36 36">
			<path
				class="line line-top-bottom"
				d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
			/>
			<path class="line" d="M7 16 27 16" />
		</svg>
	</label>

	<div class="header-container">
		<a href="/">
			<img src={logo} alt="logo" class="logo" />
		</a>
	</div>

	<div class="search-container">
		<Search placeholder="Search for a movie or person..." />
	</div>
	<div class="nav-links">
		{#if currentUser}
			<div class="profile-container">
				<a href={`/profile/${currentUser.user_metadata.display_name}`}>
					{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
						<img
							src={currentUser.user_metadata.avatar_url}
							alt="Profile Picture"
							class="profile-picture"
						/>
					{:else}
						<span class="placeholder-icon">👤</span>
					{/if}
				</a>
			</div>
		{:else}
			<div class="signup-container">
				<a href="/register" class="signup-link">Sign up</a>
			</div>
		{/if}
	</div>

	<div class="nav-menu" style="transform: translateX({menuOpen ? '0%' : '-100%'});">
		{#if currentUser}
			<div class="nav-items">
				<div class="left-nav-menu-items">
					<h2>Movieground</h2>
					<a href="/games" on:click={closeMenu}>Games</a>
					<hr />
					<a href="/games/daily" on:click={closeMenu}>Daily Challenge</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Explore</h2>
					<a href="/library" on:click={closeMenu}>Library</a>
					<hr />
					<a href={`/profile/${currentUser.user_metadata.display_name}`} on:click={closeMenu}
						>Profile</a
					>
					<hr />
					<a href="/random" on:click={closeMenu}>Random-Movie</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Settings</h2>
					<a href="/settings/changelog" on:click={closeMenu}>Changelog</a>
					<hr />
					<a href="/settings/account" on:click={closeMenu}>Account</a>
				</div>
			</div>
			<div class="logout-container">
				<div class="profile-logout-container">
					<a href={`/profile/${currentUser.user_metadata.display_name}`} on:click={closeMenu}>
						{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
							<img
								src={currentUser.user_metadata.avatar_url}
								alt="Profile Picture"
								class="profile-picture"
							/>
						{:else}
							<span class="placeholder-icon">👤</span>
						{/if}
					</a>
				</div>
				<button class="Btn" on:click={signOut} on:click={closeMenu}>
					<div class="sign">
						<svg viewBox="0 0 512 512">
							<path
								d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
							/>
						</svg>
					</div>
				</button>
			</div>
		{:else}
			<div class="nav-items">
				<div class="left-nav-menu-items">
					<h2>Movieground</h2>
					<a href="/games" on:click={closeMenu}>Games</a>
					<hr />
					<a href="/games/daily" on:click={closeMenu}>Daily Challenge</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Explore</h2>
					<a href="/library" on:click={closeMenu}>Library</a>
					<hr />
					<a href="/random" on:click={closeMenu}>Random-Movie</a>
					<hr />
					<a href="/login" on:click={closeMenu}>Login</a>
					<hr />
					<a href="/register" on:click={closeMenu}>Register</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Settings</h2>
					<a href="/settings/changelog" on:click={closeMenu}>Changelog</a>
					<hr />
					<a href="/settings/account" on:click={closeMenu}>Account</a>
				</div>
			</div>
		{/if}
	</div>
</nav>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');

	nav {
		z-index: 999;
	}

	h2 {
		padding-bottom: 0.5rem;
	}

	.nav-items {
		display: flex;
		width: 100%;
		position: absolute;
		top: 20%;
	}

	.signup-container {
		padding-left: 30px;
	}

	.nav-items div {
		padding-left: 100px;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	@media (max-width: 965px) {
		.nav-items {
			display: grid;
			justify-content: center;
		}
		.nav-items div {
			padding-left: 0px;
			padding-bottom: 50px;
		}
	}

	@media (max-width: 768px) {
		.signup-container {
			padding-left: 0px;
		}

		.nav-links {
			flex-direction: column;
			align-items: flex-start;
		}

		.search-container {
			position: absolute;
			top: 12%;
			width: 100%;
		}
	}

	.navbar-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
	}

	.header-container {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.logo {
		width: 30rem;
		max-width: 30rem;
	}

	.hamburger {
		cursor: pointer;
		height: 50px !important;
		width: 50px !important;
		z-index: 999;
		padding-left: 20px;
	}

	.hamburger input {
		display: none;
	}

	.hamburger svg {
		height: 4em;
		transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.line {
		fill: none;
		stroke: white;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 3;
		transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
			stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.line-top-bottom {
		stroke-dasharray: 12 63;
	}

	.hamburger input:checked + svg {
		transform: rotate(-45deg);
	}

	.hamburger input:checked + svg .line-top-bottom {
		stroke-dasharray: 20 300;
		stroke-dashoffset: -32.42;
	}

	.nav-menu {
		position: fixed;
		top: 0;
		left: 0%;
		height: 100%;
		width: 100%;
		opacity: 1;
		background-color: #333;
		box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		justify-content: center;
		transition: transform 0.3s ease-in-out;
		z-index: 998;
	}

	.nav-menu a {
		font-size: 3rem;
	}

	.nav-menu a:hover {
		text-decoration: underline;
		color: #a05cd5;
	}

	a,
	button {
		color: white;
		text-decoration: none;
		margin: 10px;
	}

	.hamburger {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 30px;
		height: 25px;
		cursor: pointer;
	}

	a {
		text-decoration: none;
		color: white;
		font-size: 1.2rem;
	}

	/* logout button */

	.logout-container {
		position: absolute;
		bottom: 1%;
		right: 0;
		display: flex;
		align-items: center;
	}

	.logout-container .profile-picture {
		width: 40px;
		height: 40px;
	}

	.logout-container a {
		font-size: 0rem;
	}

	.Btn {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		width: 45px;
		height: 45px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition-duration: 0.3s;
		background-color: transparent;
	}

	/* plus sign */
	.sign {
		width: 100%;
		transition-duration: 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sign svg {
		width: 25px;
	}

	.sign svg path {
		fill: white;
	}

	/* button click effect*/
	.Btn:active {
		transform: translate(2px, 2px);
	}

	.profile-picture {
		width: 50px;
		height: 50px;
		border-radius: 50%;
	}

	.profile-container {
		margin-left: auto;
	}

	.signup-link {
		margin-left: auto;
	}

	.placeholder-icon {
		font-size: 2rem;
	}

	@media (max-width: 768px) {
		.logo {
			width: 150px;
			max-width: 150px;
		}
		.nav-menu a {
			font-size: 2.5rem;
		}
		.nav-items {
			top: 8%;
		}
	}
</style>
