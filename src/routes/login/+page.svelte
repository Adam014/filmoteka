<script>
	import { supabase } from '../../lib/db/supabaseClient';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let errorMessage = '';
	let session = null;
	let loading = true; // Track loading state

	onMount(async () => {
		// Fetch the session directly from Supabase
		const { data, error } = await supabase.auth.getSession();
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
		} else {
			// Redirect to home page after successful login
			goto('/');
		}
	}
</script>

{#if loading}
	<p>Loading...</p>
	<!-- Display loading message until session is checked -->
{:else}
	<h1>Login</h1>

	<form on:submit|preventDefault={signIn}>
		<div>
			<label for="email">Email:</label>
			<input id="email" type="email" bind:value={email} required />
		</div>

		<div>
			<label for="password">Password:</label>
			<input id="password" type="password" bind:value={password} required />
		</div>

		{#if errorMessage}
			<p class="error">{errorMessage}</p>
		{/if}

		<button type="submit">Login</button>
	</form>

	<p>Don't have an account? <a href="/register">Register here</a></p>
{/if}

<style>
	/* Add any styles you need here */
</style>
