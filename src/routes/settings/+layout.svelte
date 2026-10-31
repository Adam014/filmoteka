<script>
	import { page } from '$app/state';

	let { children } = $props();

	const TABS = [
		{ href: '/settings/account', label: 'Account' },
		{ href: '/settings/changelog', label: 'Changelog' }
	];
</script>

<div class="container page">
	<h1 class="page-title">Settings</h1>
	<nav aria-label="Settings">
		{#each TABS as tab (tab.href)}
			<a href={tab.href} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>
				{tab.label}
			</a>
		{/each}
	</nav>
	{@render children()}
</div>

<style>
	nav {
		display: flex;
		gap: 24px;
		margin-top: 24px;
		border-bottom: 1px solid var(--line);
	}

	a {
		margin-bottom: -1px;
		padding: 10px 0;
		border-bottom: 2px solid transparent;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	a:hover {
		color: var(--text);
	}

	a[aria-current='page'] {
		border-color: var(--text);
		color: var(--text);
	}
</style>
