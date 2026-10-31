<script>
	import Icon from './Icon.svelte';

	let { open = $bindable(false), title, wide = false, children } = $props();
	let dialog = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function closeOnBackdrop(event) {
		if (event.target === dialog) open = false;
	}
</script>

<dialog
	bind:this={dialog}
	class:wide
	aria-label={title}
	onclose={() => (open = false)}
	onclick={closeOnBackdrop}
>
	{#if open}
		<div class="frame">
			<header>
				<h2>{title}</h2>
				<button class="icon-btn" type="button" aria-label="Close" onclick={() => (open = false)}>
					<Icon name="close" />
				</button>
			</header>
			<div class="body">{@render children()}</div>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: min(480px, calc(100vw - 32px));
		max-height: min(80dvh, 720px);
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		overflow: hidden;
	}

	dialog.wide {
		width: min(1100px, calc(100vw - 32px));
		max-height: none;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.72);
	}

	.frame {
		display: flex;
		flex-direction: column;
		max-height: inherit;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 6px 6px 6px 18px;
		border-bottom: 1px solid var(--line);
	}

	h2 {
		font-size: 1rem;
	}

	.body {
		overflow-y: auto;
	}
</style>
