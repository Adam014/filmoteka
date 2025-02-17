<script>
	import { supabase } from '../../lib/db/supabaseClient';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';

	let newPassword = '';

	async function updatePassword() {
		const { error } = await supabase.auth.updateUser({ password: newPassword });

		if (error) {
			toast.error(`Error updating password: ${error.message}`);
		} else {
			toast.success('Password updated successfully.');
			// Redirect user after successful update – adjust as needed (e.g., to the login page)
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Update Password</title>
</svelte:head>

<div class="account-container">
	<div class="reset-password">
		<h2>Reset password</h2>
		<div class="reset-form">
			<div class="input-container">
				<input type="email" bind:value={newPassword} required />
				<label for="input" class="label">Enter your new password</label>
				<div class="underline" />
			</div>
			<button on:click={updatePassword}>Update</button>
		</div>
	</div>
</div>

<style>
	.reset-password {
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
		background-color: #333;
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
