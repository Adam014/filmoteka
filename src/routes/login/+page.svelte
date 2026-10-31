<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AuthPage from '#lib/components/AuthPage.svelte';
	import { safeNext } from '#lib/redirects.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { supabase } from '#lib/supabase.js';
	import { friendlyAuthError } from '#lib/user.js';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	let next = $derived(safeNext(page.url.searchParams.get('next')));

	// Someone already signed in has nothing to do here.
	$effect(() => {
		if (auth.ready && auth.user) goto(next === '/' ? '/profile' : next, { replace: true });
	});

	async function run(action, successMessage) {
		error = '';
		if (!supabase) {
			error = 'Sign-in is unavailable right now.';
			return;
		}
		busy = true;
		try {
			const { error: authError } = await action();
			if (authError) {
				error = friendlyAuthError(authError);
				return;
			}
			toast.success(successMessage);
			await goto(next, { replace: true });
		} catch (caught) {
			error = friendlyAuthError(caught);
		} finally {
			busy = false;
		}
	}

	function signIn(event) {
		event.preventDefault();
		run(() => supabase.auth.signInWithPassword({ email, password }), 'Welcome back');
	}

	const continueAsGuest = () =>
		run(() => supabase.auth.signInAnonymously(), "You're browsing as a guest");
</script>

<svelte:head>
	<title>Log in | Filmoteka</title>
</svelte:head>

<AuthPage title="Log in">
	<form onsubmit={signIn}>
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
		<div class="field">
			<label for="password">Password</label>
			<input
				id="password"
				class="input"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				required
			/>
		</div>
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
		<button class="btn btn-primary btn-block" type="submit" disabled={busy}>
			{busy ? 'Logging in…' : 'Log in'}
		</button>
		<button class="btn btn-block" type="button" disabled={busy} onclick={continueAsGuest}>
			Continue as guest
		</button>
	</form>

	{#snippet footer()}
		<p>New here? <a class="link" href="/register">Create an account</a></p>
		<p><a class="link" href="/forgot-password">Forgot your password?</a></p>
	{/snippet}
</AuthPage>
