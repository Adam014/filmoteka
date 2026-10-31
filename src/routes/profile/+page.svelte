<script>
	import { goto } from '$app/navigation';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import { loginHref } from '#lib/redirects.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { displayName, profileHref } from '#lib/user.js';

	let name = $derived(displayName(auth.user));

	$effect(() => {
		if (!auth.ready) return;
		if (!auth.user) goto(loginHref('/profile'), { replace: true });
		else if (name) goto(profileHref(name), { replace: true });
	});
</script>

<svelte:head>
	<title>Profile | Filmoteka</title>
</svelte:head>

{#if auth.ready && auth.user && !name}
	<div class="container">
		<EmptyState heading="h1" title="You're browsing as a guest">
			<p>Create an account to get a profile, save favorites and follow people.</p>
			<a class="btn btn-primary" href="/register">Create an account</a>
		</EmptyState>
	</div>
{/if}
