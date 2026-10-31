<script>
	/** `marks` holds one of right, wrong or done for every finished step. */
	let { total, marks = [], label } = $props();
</script>

<ol class="pips" aria-label={label}>
	{#each { length: total }, index (index)}
		<li class={marks[index] ?? ''} class:current={index === marks.length}></li>
	{/each}
</ol>

<style>
	.pips {
		display: flex;
		gap: 6px;
	}

	li {
		width: 10px;
		height: 10px;
		background: rgb(255 255 255 / 0.18);
		border-radius: 50%;
		transition:
			background-color 200ms var(--ease),
			transform 360ms var(--spring);
	}

	.current {
		background: var(--text);
		transform: scale(1.15);
	}

	.right {
		background: var(--success);
	}

	.wrong {
		background: var(--danger);
	}

	.done {
		background: var(--text-faint);
	}
</style>
