<script>
	import { supabase } from '../../lib/db/supabaseClient';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import supabase_logo from '../../lib/assets/supabase.svg';
	import filmoteka_transparent from '../../lib/assets/filmoteka_transparent.svg';
	import toast from 'svelte-french-toast';

	let email = '';
	let password = '';
	let errorMessage = '';
	let session = null;
	let loading = true; // Track loading state

	onMount(async () => {
		// Fetch the session directly from Supabase
		const { data } = await supabase.auth.getSession();
		session = data.session;

		if (session) {
			// If there's an active session, redirect to the profile page
			goto('/profile');
		} else {
			// Stop loading once the session has been checked
			loading = false;
		}
	});

	async function signIn() {
		errorMessage = '';
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			errorMessage = error.message;
			toast.error(error.message);
		} else {
			// Redirect to home page after successful login
			goto('/');
			toast.success('You are logged in!', { duration: 10000 });
		}
	}
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<div class="form-wrapper">
		<div class="logo-container">
			<a href="/">
				<img src={filmoteka_transparent} alt="filmoteka_logo" />
			</a>
		</div>
		<h1>Login</h1>
		<div class="form-container">
			<form on:submit|preventDefault={signIn}>
				<div class="input-group">
					<label for="email">Email:</label>
					<input id="email" type="email" bind:value={email} required />
				</div>

				<div class="input-group">
					<label for="password">Password:</label>
					<input id="password" type="password" bind:value={password} required />
				</div>

				<button type="submit">Login</button>
			</form>
		</div>

		<p class="footer">Don't have an account? <a href="/register">Register here</a></p>
		<p class="supabase">
			Powered by <a class="supabase-link" href="https://supabase.com"
				><img src={supabase_logo} alt="supabase_logo" /></a
			>
		</p>
	</div>
{/if}

<style>
	.supabase {
		padding-top: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.supabase-link {
		color: #36bc80;
	}

	.supabase img {
		width: 90px;
		padding: 5px 0px 0px 10px;
	}

	.form-wrapper {
		width: 25vw;
		padding: 5vh;
		margin: 2.3rem;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
	}

	.logo-container {
		display: flex;
		justify-content: center;
		padding-bottom: 20px;
	}

	.form-wrapper img {
		width: 90px;
	}

	h1 {
		text-align: center;
		color: #e5e5e5;
		font-size: 3rem;
		padding-bottom: 40px;
	}

	.input-group {
		width: 100%;
		margin-bottom: 20px;
	}

	label {
		display: block;
		margin-bottom: 5px;
		color: #e5e5e5;
	}

	input[type='email'],
	input[type='password'] {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-sizing: border-box;
		color: black;
	}

	button {
		width: 100%;
		padding: 10px;
		background-color: #7a1cac;
		border: none;
		border-radius: 4px;
		color: #fff;
		cursor: pointer;
		transition: 0.2s ease-in;
	}

	button:hover {
		background-color: #430c5c;
	}

	button:disabled {
		background-color: #ccc;
	}

	.footer {
		text-align: center;
		margin-top: 20px;
	}

	.footer a {
		color: #7a1cac;
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	.error {
		color: #ff0000;
	}

	@media (max-width: 1024px) {
		.form-wrapper {
			width: 60%;
			background-color: rgba(26, 26, 26, 0.9);
			color: #fff;
		}

		h1 {
			font-size: 2.5rem;
			padding-bottom: 0px !important;
		}

		.logo-container img {
			width: 100px;
		}

		.logo-container {
			padding-top: 20px;
		}

		.supabase {
			padding-top: 50px;
		}

		form {
			width: 70%;
		}

		.form-container {
			display: flex;
			justify-content: center;
		}

		h1 {
			color: #fff;
		}

		label,
		input {
			color: #fff;
		}
	}

	@media (max-width: 768px) {
		input[type='email'],
		input[type='password'],
		input[type='text'],
		input[type='file'] {
			padding: 5px;
		}
		form {
			width: 100%;
		}

		h1 {
			font-size: 1.8rem;
		}

		.form-wrapper {
			width: 100%;
		}
		.logo-container img {
			width: 80px;
		}
		.form-wrapper {
			width: 100%;
			padding: 4vh;
			margin: 1rem;
		}
	}
</style>
