<script>
	import { goto } from '$app/navigation';
	import AuthPage from '#lib/components/AuthPage.svelte';
	import { auth } from '#lib/state/auth.svelte.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { supabase } from '#lib/supabase.js';
	import { friendlyAuthError } from '#lib/user.js';

	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	async function save(event) {
		event.preventDefault();
		error = '';
		busy = true;
		try {
			const { error: updateError } = await supabase.auth.updateUser({ password });
			if (updateError) {
				error = friendlyAuthError(updateError);
				return;
			}
			toast.success('Password updated');
			await goto('/', { replace: true });
		} catch (caught) {
			error = friendlyAuthError(caught);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Choose a new password | Filmoteka</title>
</svelte:head>

{#if auth.ready && !auth.user}
	<AuthPage title="This link has expired" lede="Reset links work once and only for a short time.">
		<a class="btn btn-primary btn-block" href="/forgot-password">Request a new link</a>
	</AuthPage>
{:else}
	<AuthPage title="Choose a new password">
		<form onsubmit={save}>
			<div class="field">
				<label for="password">New password</label>
				<input
					id="password"
					class="input"
					type="password"
					bind:value={password}
					minlength="6"
					autocomplete="new-password"
					required
				/>
				<p class="field-hint">At least 6 characters.</p>
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<button class="btn btn-primary btn-block" type="submit" disabled={busy || !auth.ready}>
				{busy ? 'Saving…' : 'Save password'}
			</button>
		</form>
	</AuthPage>
{/if}
