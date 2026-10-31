<script>
	import { goto } from '$app/navigation';
	import { formatDate } from '#lib/format.js';
	import { loginHref } from '#lib/redirects.js';
	import { auth, signOut } from '#lib/state/auth.svelte.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { supabase } from '#lib/supabase.js';
	import { displayName, friendlyAuthError, isGuest, profileHref } from '#lib/user.js';

	let busy = $state(false);
	let name = $derived(displayName(auth.user));

	async function sendReset() {
		busy = true;
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(auth.user.email, {
				redirectTo: `${location.origin}/reset-password`
			});
			if (error) toast.error(friendlyAuthError(error));
			else toast.success(`Reset link sent to ${auth.user.email}`);
		} catch (error) {
			toast.error(friendlyAuthError(error));
		} finally {
			busy = false;
		}
	}

	async function logOut() {
		const { error } = await signOut();
		if (error) {
			toast.error("We couldn't log you out. Please try again.");
			return;
		}
		await goto('/');
	}
</script>

<svelte:head>
	<title>Account settings | Filmoteka</title>
</svelte:head>

<section class="content">
	{#if !auth.ready}
		<div class="skeleton line" aria-hidden="true"></div>
		<div class="skeleton line" aria-hidden="true"></div>
	{:else if !auth.user}
		<h2 class="section-title">You're not logged in</h2>
		<p class="copy">Log in to manage your account.</p>
		<div class="actions">
			<a class="btn btn-primary" href={loginHref('/settings/account')}>Log in</a>
			<a class="btn" href="/forgot-password">Forgot your password?</a>
		</div>
	{:else if isGuest(auth.user)}
		<h2 class="section-title">You're browsing as a guest</h2>
		<p class="copy">Create an account to save favorites and follow people.</p>
		<div class="actions">
			<a class="btn btn-primary" href="/register">Create an account</a>
			<button class="btn" type="button" onclick={logOut}>Log out</button>
		</div>
	{:else}
		<dl class="facts">
			{#if name}
				<div>
					<dt>Username</dt>
					<dd><a class="link" href={profileHref(name)}>{name}</a></dd>
				</div>
			{/if}
			<div>
				<dt>Email</dt>
				<dd>{auth.user.email}</dd>
			</div>
			<div>
				<dt>Member since</dt>
				<dd>{formatDate(auth.user.created_at)}</dd>
			</div>
		</dl>

		<h2 class="section-title password">Password</h2>
		<p class="copy">We'll email you a secure link to choose a new one.</p>
		<div class="actions">
			<button class="btn" type="button" disabled={busy} onclick={sendReset}>
				{busy ? 'Sending…' : 'Send reset link'}
			</button>
			<button class="btn btn-quiet" type="button" onclick={logOut}>Log out</button>
		</div>
	{/if}
</section>

<style>
	.content {
		max-width: 640px;
		margin-top: 32px;
	}

	.line {
		height: 44px;
		margin-bottom: 8px;
	}

	.copy {
		margin-top: 8px;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 20px;
	}

	.facts > div {
		display: grid;
		grid-template-columns: minmax(96px, 160px) minmax(0, 1fr);
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--text-faint);
	}

	.password {
		margin-top: 40px;
	}
</style>
