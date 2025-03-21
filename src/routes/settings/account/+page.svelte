<script>
	import { user } from '../../../stores/user';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import { supabase } from '../../../lib/db/supabaseClient';

	let currentUser;
	let email = '';

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	async function handlePasswordReset() {
		// The redirectTo URL should match one allowed in your Supabase settings.
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: 'https://filmoteka.app/reset-password'
		});

		if (error) {
			toast.error(`Error sending reset email: ${error.message}`);
		} else {
			email = '';
			toast.success('Password reset email sent. Please check your inbox.');
		}
	}

	onDestroy(() => {
		unsubscribe(); // Clean up subscription
	});
</script>

<svelte:head>
	<title>Account Settings</title>
</svelte:head>

<div class="account-container">
	<h1>Account Settings</h1>
	<div class="reset-password">
		<h2>Reset password</h2>
		<div class="reset-form">
			<div class="input-container">
				<input type="email" bind:value={email} required />
				<label for="input" class="label">Enter your email</label>
				<div class="underline" />
			</div>
			<button on:click={handlePasswordReset}>Send Reset Link</button>
		</div>
	</div>
</div>

<style>
	.reset-password,
	h1 {
		padding: 5rem 0rem 0rem 5rem;
	}

	.reset-form {
		padding-top: 40px;
		display: flex;
	}

	button {
		margin-left: 20px;
		padding: 9px;
		width: 13%;
		cursor: pointer;
		background-color: #a05cd5;
		color: white;
		border: 0;
		border-radius: 5px;
	}

	button:hover {
		background-color: transparent;
		border: 2px solid #a05cd5;
	}

	/* custom input */

	.input-container {
		position: relative;
		width: 25%;
	}

	.input-container input[type='email'] {
		font-size: 20px;
		width: 100%;
		border: none;
		border-bottom: 2px solid #ccc;
		padding: 5px 0;
		background-color: transparent;
		outline: none;
		color: white;
	}

	.input-container .label {
		position: absolute;
		top: 0;
		left: 0;
		color: #ccc;
		transition: all 0.3s ease;
		pointer-events: none;
	}

	.input-container input[type='email']:focus ~ .label,
	.input-container input[type='email']:valid ~ .label {
		top: -30px;
		font-size: 18px;
		color: #fff;
	}

	.input-container .underline {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		width: 100%;
		background-color: #ccc;
		transform: scaleX(0);
		transition: all 0.3s ease;
	}

	.input-container input[type='email']:focus ~ .underline,
	.input-container input[type='email']:valid ~ .underline {
		transform: scaleX(1);
	}

	@media (max-width: 970px) {
		.input-container {
			width: 70%;
		}
		button {
			width: 20%;
		}
		.reset-password,
		h1 {
			padding: 4rem 0rem 0rem 2rem;
		}
	}

	@media (max-width: 768px) {
		.input-container {
			width: 60%;
		}
		button {
			width: 33%;
		}
	}
</style>
