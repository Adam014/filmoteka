<script>
	import { dismiss, toasts } from '../state/toast.svelte.js';
	import Icon from './Icon.svelte';
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as item (item.id)}
		<div class="toast {item.kind}">
			{#if item.kind === 'success'}
				<Icon name="check" size={18} class="toast-icon" />
			{/if}
			<p>{item.message}</p>
			<button
				class="toast-close"
				type="button"
				aria-label="Dismiss"
				onclick={() => dismiss(item.id)}
			>
				<Icon name="close" size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		z-index: 60;
		right: var(--gutter);
		bottom: 16px;
		display: grid;
		gap: 8px;
		width: min(380px, calc(100vw - 2 * var(--gutter)));
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 8px 10px 14px;
		background: var(--surface-raised);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.45);
		font-size: 0.9375rem;
		pointer-events: auto;
		animation: enter 420ms var(--spring);
	}

	.toast.success :global(.toast-icon) {
		flex: none;
		color: var(--success);
	}

	.toast.error {
		border-color: var(--danger);
	}

	p {
		flex: 1;
	}

	.toast-close {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
	}

	.toast-close:hover {
		color: var(--text);
		background: rgb(255 255 255 / 0.07);
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.96);
		}
	}
</style>
