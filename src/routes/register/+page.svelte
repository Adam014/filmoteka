<script>
	import { supabase } from '../../lib/db/supabaseClient';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let username = '';
	let profilePicture = null;
	let uploading = false;
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

	async function signUp() {
		try {
			uploading = true;
			errorMessage = '';

			// Upload the profile picture first
			let avatar_url = '';

			if (profilePicture) {
				const fileExt = profilePicture.name.split('.').pop();
				const fileName = `${email}.${fileExt}`;
				const filePath = `public/${email}/${fileName}`;

				const { data: avatarData, error: avatarError } = await supabase.storage
					.from('avatars')
					.upload(filePath, profilePicture);

				if (avatarError) {
					errorMessage = avatarError.message;
					return;
				}

				const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

				avatar_url = publicUrlData.publicUrl;
			}

			// Sign up the user with additional user metadata, including display_name
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						avatar_url,
						display_name: username // Store the username as display_name in user metadata
					}
				}
			});

			if (error) {
				errorMessage = error.message;
			} else {
				alert('Registration successful! Please check your email to confirm your account.');
				goto('/login');
			}
		} catch (error) {
			console.error('Error during registration:', error);
			errorMessage = 'An unexpected error occurred.';
		} finally {
			uploading = false;
		}
	}

	function handleFileChange(event) {
		if (event.target.files && event.target.files[0]) {
			profilePicture = event.target.files[0];
		}
	}
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<h1>Register</h1>

	<form on:submit|preventDefault={signUp}>
		<div>
			<label for="email">Email:</label>
			<input id="email" type="email" bind:value={email} required />
		</div>

		<div>
			<label for="password">Password:</label>
			<input id="password" type="password" bind:value={password} required />
		</div>

		<div>
			<label for="username">Username:</label>
			<input id="username" type="text" bind:value={username} required />
		</div>

		<div>
			<label for="profilePicture">Profile Picture:</label>
			<input id="profilePicture" type="file" accept="image/*" on:change={handleFileChange} />
		</div>

		{#if errorMessage}
			<p class="error">{errorMessage}</p>
		{/if}

		<button type="submit" disabled={uploading}>
			{uploading ? 'Registering...' : 'Register'}
		</button>
	</form>

	<p>Already have an account? <a href="/login">Login here</a></p>
{/if}

<style>
</style>
