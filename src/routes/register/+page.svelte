<script>
	import { supabase } from '../../lib/db/supabaseClient';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import supabase_logo from '../../lib/assets/supabase.svg';
	import filmoteka_transparent from '../../lib/assets/filmoteka_transparent.svg';
	import toast from 'svelte-french-toast';

	let email = '';
	let password = '';
	let username = '';
	let profilePicture = null;
	let uploading = false;
	let errorMessage = '';
	let session = null;
	let loading = true; // Track loading state

	onMount(async () => {
		const { data } = await supabase.auth.getSession();
		session = data.session;

		if (session) {
			goto('/profile');
		} else {
			loading = false;
		}
	});

	async function signUp() {
		try {
			uploading = true;
			errorMessage = '';

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

			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						avatar_url,
						display_name: username
					}
				}
			});

			if (error) {
				errorMessage = error.message;
				toast.error(error.message);
			} else {
				goto('/login');
				toast.success('Registration successful! Please check your email to confirm your account.', {
					duration: 10000
				});
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

	async function signInAnonymously() {
		errorMessage = '';
		const { data, error } = await supabase.auth.signInAnonymously();

		if (error) {
			errorMessage = error.message;
			toast.error(error.message);
		} else {
			// Redirect to homepage after successful anonymous login
			goto('/');
			toast.success('Signed in as guest!', { duration: 10000 });
		}
	}
</script>

<svelte:head>
	<title>Register | Filmoteka</title>
</svelte:head>

{#if loading}
	<p>Loading...</p>
{:else}
	<div class="form-wrapper">
		<div class="logo-container">
			<a href="/">
				<img src={filmoteka_transparent} alt="filmoteka_logo" />
			</a>
		</div>
		<h1>Register</h1>
		<div class="form-container">
			<form on:submit|preventDefault={signUp}>
				<div class="input-group">
					<label for="email">Email:</label>
					<input id="email" type="email" bind:value={email} required />
				</div>

				<div class="input-group">
					<label for="password">Password:</label>
					<input id="password" type="password" bind:value={password} required />
				</div>

				<div class="input-group">
					<label for="username">Username:</label>
					<input id="username" type="text" bind:value={username} required />
				</div>

				<div class="input-group file-input">
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

			<!-- OR Separator -->
			<div class="separator">
				<span>OR</span>
			</div>

			<!-- Guest Login as Text Button -->
			<p class="guest-text" on:click={signInAnonymously}>Continue as Guest</p>
		</div>

		<p class="footer">Already have an account? <a href="/login">Login here</a></p>
		<p class="footer">Forgot password? <a href="/settings/account">Reset password</a></p>
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

	.separator {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 20px 0;
	}

	.separator::before,
	.separator::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #ddd;
	}

	.separator span {
		padding: 0 10px;
		color: #ddd;
		font-size: 1rem;
	}

	.guest-text {
		text-align: center;
		color: #7a1cac;
		font-size: 1.2rem;
		cursor: pointer;
		font-weight: bold;
		transition: 0.2s ease-in;
		margin-top: 10px;
	}

	.guest-text:hover {
		text-decoration: underline;
		color: #ad49e1;
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
	input[type='password'],
	input[type='text'],
	input[type='file'] {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-sizing: border-box;
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
			padding-top: 20px;
		}

		form {
			width: 70%;
		}
	}

	@media (max-width: 768px) {
		input[type='email'],
		input[type='password'],
		input[type='text'],
		input[type='file'] {
			padding: 5px;
		}
		.logo-container img {
			width: 80px;
		}
		h1 {
			font-size: 1.8rem;
		}

		form {
			width: 100%;
		}
		.form-wrapper {
			width: 100%;
			padding: 4vh;
			margin: 1rem;
		}
	}
</style>
