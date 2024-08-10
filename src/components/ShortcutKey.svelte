<script>
	export let keyLabel = '';
</script>

<div class="shortcut-key">
	{keyLabel}
</div>

<style>
	.shortcut-key {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		background-color: #222;
		color: #fff;
		font-size: 0.8rem;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #444;
		pointer-events: none;
	}
</style>
