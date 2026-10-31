<script>
	let { value, duration = 900, decimals = 0, from = 0 } = $props();

	const format = (number) =>
		new Intl.NumberFormat('en-US', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals
		}).format(number);

	// Stays null outside the animation, so the server and reduced motion show the real value.
	let animated = $state(null);
	let last = null;

	$effect(() => {
		const target = value;
		const startValue = last ?? from;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const start = performance.now();
		let frame = requestAnimationFrame(function step(now) {
			const progress = Math.min((now - start) / duration, 1);
			animated = startValue + (target - startValue) * (1 - (1 - progress) ** 4);
			if (progress < 1) frame = requestAnimationFrame(step);
			else animated = null;
		});
		return () => {
			last = animated ?? target;
			cancelAnimationFrame(frame);
		};
	});
</script>

<span class="count">{format(animated ?? value)}</span>

<style>
	.count {
		font-variant-numeric: tabular-nums;
	}
</style>
