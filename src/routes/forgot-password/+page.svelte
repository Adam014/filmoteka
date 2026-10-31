<script>
	import AuthPage from '#lib/components/AuthPage.svelte';
	import { supabase } from '#lib/supabase.js';
	import { friendlyAuthError } from '#lib/user.js';

	let email = $state('');
	let error = $state('');
	let busy = $state(false);
	let sentTo = $state('');

	async function send(event) {
		event.preventDefault();
		error = '';
		if (!supabase) {
			error = 'Password reset is unavailable right now.';
			return;
		}
		busy = true;
		try {
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${location.origin}/reset-password`
			});
			if (resetError) error = friendlyAuthError(resetError);
			else sentTo = email;
		} catch (caught) {
			error = friendlyAuthError(caught);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Reset your password | Filmoteka</title>
</svelte:head>

{#if sentTo}
	<AuthPage title="Check your inbox" lede="If {sentTo} has an account, a reset link is on its way.">
		<a class="btn btn-block" href="/login">Back to log in</a>
	</AuthPage>
{:else}
	<AuthPage title="Reset your password" lede="Enter your email and we'll send you a link.">
		<form onsubmit={send}>
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					class="input"
					type="email"
					bind:value={email}
					autocomplete="email"
					required
				/>
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<button class="btn btn-primary btn-block" type="submit" disabled={busy}>
				{busy ? 'Sending…' : 'Send reset link'}
			</button>
		</form>

		{#snippet footer()}
			<p><a class="link" href="/login">Back to log in</a></p>
		{/snippet}
	</AuthPage>
{/if}
