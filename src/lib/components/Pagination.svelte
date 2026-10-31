<script>
	import { pageWindow } from '../pagination.js';
	import Icon from './Icon.svelte';

	let { current, total, params = {} } = $props();

	let pages = $derived(pageWindow(current, total));

	function href(page) {
		const query = new URLSearchParams({ ...params, page: String(page) });
		return `?${query}`;
	}
</script>

{#if total > 1}
	<nav class="pagination" aria-label="Pagination">
		<ul>
			<li>
				{#if current > 1}
					<a class="icon-btn" href={href(current - 1)} aria-label="Previous page">
						<Icon name="left" />
					</a>
				{/if}
			</li>
			{#each pages as page, index (`${page}-${index}`)}
				<li>
					{#if page === '…'}
						<span class="gap" aria-hidden="true">…</span>
					{:else}
						<a
							class="page"
							class:active={page === current}
							href={href(page)}
							aria-label="Page {page}"
							aria-current={page === current ? 'page' : undefined}
						>
							{page}
						</a>
					{/if}
				</li>
			{/each}
			<li>
				{#if current < total}
					<a class="icon-btn" href={href(current + 1)} aria-label="Next page">
						<Icon name="right" />
					</a>
				{/if}
			</li>
		</ul>

		<form method="get" class="jump">
			{#each Object.entries(params) as [name, value] (name)}
				<input type="hidden" {name} {value} />
			{/each}
			<label for="page-jump">Go to</label>
			<input
				id="page-jump"
				class="input"
				type="number"
				name="page"
				min="1"
				max={total}
				inputmode="numeric"
				placeholder={String(current)}
				required
			/>
			<span class="of">of {total}</span>
		</form>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 24px;
		margin-top: clamp(40px, 6vw, 64px);
		padding-top: 24px;
		border-top: 1px solid var(--line);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px;
	}

	.page,
	.gap {
		display: grid;
		place-items: center;
		min-width: 44px;
		height: 44px;
		padding: 0 8px;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}

	.page:hover {
		color: var(--text);
		background: rgb(255 255 255 / 0.07);
	}

	.page.active {
		background: var(--text);
		color: #0a0a0b;
	}

	.jump {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.jump .input {
		width: 84px;
		font-size: 0.9375rem;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.jump .input::-webkit-inner-spin-button {
		appearance: none;
	}
</style>
